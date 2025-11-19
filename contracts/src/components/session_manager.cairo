use core::pedersen::pedersen;
use starknet::get_block_timestamp;
use cavos_wallet::interfaces::isession_wallet::{SessionKey, SessionPolicy};

#[starknet::component]
pub mod SessionManagerComponent {
    use super::{SessionKey, SessionPolicy, pedersen, get_block_timestamp};
    use starknet::storage::{
        Map, StorageMapReadAccess, StorageMapWriteAccess,
        StoragePointerReadAccess, StoragePointerWriteAccess
    };

    #[storage]
    pub struct Storage {
        /// Mapping from session ID to SessionKey data
        sessions: Map<felt252, SessionKey>,
        /// Counter for generating unique session IDs
        session_counter: u64,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        SessionCreated: SessionCreated,
        SessionRevoked: SessionRevoked,
        SessionExpired: SessionExpired,
    }

    #[derive(Drop, starknet::Event)]
    pub struct SessionCreated {
        pub session_id: felt252,
        pub public_key: felt252,
        pub expires_at: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct SessionRevoked {
        pub session_id: felt252,
        pub revoked_at: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct SessionExpired {
        pub session_id: felt252,
        pub expired_at: u64,
    }

    #[generate_trait]
    pub impl SessionManagerImpl<
        TContractState, +HasComponent<TContractState>
    > of SessionManagerTrait<TContractState> {
        /// Create a new session
        fn create_session(
            ref self: ComponentState<TContractState>,
            session_public_key: felt252,
            max_amount_per_tx: u256,
            max_amount_per_day: u256,
            duration_seconds: u64,
        ) -> felt252 {
            let current_time = get_block_timestamp();
            let expires_at = current_time + duration_seconds;

            // Generate unique session ID
            let counter = self.session_counter.read();
            let session_id = pedersen(session_public_key, counter.into());
            self.session_counter.write(counter + 1);

            // Create policy (allowed_contracts stored separately in main contract)
            let policy = SessionPolicy {
                max_amount_per_tx,
                max_amount_per_day,
                daily_spent: 0_u256,
                last_reset_day: current_time / 86400, // Current day
            };

            // Create session key
            let session = SessionKey {
                public_key: session_public_key,
                policy,
                created_at: current_time,
                expires_at,
                is_active: true,
            };

            // Store session
            self.sessions.write(session_id, session);

            // Emit event
            self.emit(SessionCreated {
                session_id,
                public_key: session_public_key,
                expires_at,
            });

            session_id
        }

        /// Revoke a session
        fn revoke_session(
            ref self: ComponentState<TContractState>,
            session_id: felt252,
        ) {
            let mut session = self.sessions.read(session_id);
            assert(session.is_active, 'Session not active');

            session.is_active = false;
            self.sessions.write(session_id, session);

            self.emit(SessionRevoked {
                session_id,
                revoked_at: get_block_timestamp(),
            });
        }

        /// Get session data
        fn get_session(
            self: @ComponentState<TContractState>,
            session_id: felt252,
        ) -> SessionKey {
            self.sessions.read(session_id)
        }

        /// Check if session is valid (active and not expired)
        fn is_session_valid(
            self: @ComponentState<TContractState>,
            session_id: felt252,
        ) -> bool {
            let session = self.sessions.read(session_id);

            if !session.is_active {
                return false;
            }

            let current_time = get_block_timestamp();
            if current_time >= session.expires_at {
                return false;
            }

            true
        }

        /// Update session policy (for tracking daily spending)
        fn update_session_policy(
            ref self: ComponentState<TContractState>,
            session_id: felt252,
            new_policy: SessionPolicy,
        ) {
            let mut session = self.sessions.read(session_id);
            session.policy = new_policy;
            self.sessions.write(session_id, session);
        }

        /// Get session public key
        fn get_session_public_key(
            self: @ComponentState<TContractState>,
            session_id: felt252,
        ) -> felt252 {
            let session = self.sessions.read(session_id);
            session.public_key
        }
    }
}
