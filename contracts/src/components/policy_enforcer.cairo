use cavos_wallet::interfaces::isession_wallet::SessionPolicy;

const SECONDS_PER_DAY: u64 = 86400;

#[starknet::component]
pub mod PolicyEnforcerComponent {
    use super::{SessionPolicy, SECONDS_PER_DAY};
    use starknet::{ContractAddress, get_block_timestamp};

    #[storage]
    pub struct Storage {}

    #[generate_trait]
    pub impl PolicyEnforcerImpl<
        TContractState, +HasComponent<TContractState>
    > of PolicyEnforcerTrait<TContractState> {
        /// Check if transaction amount complies with the session policy limits
        fn check_compliance_amount(
            self: @ComponentState<TContractState>,
            policy: @SessionPolicy,
            amount: u256,
        ) -> bool {
            // 1. Check per-transaction limit
            if amount > *policy.max_amount_per_tx {
                return false;
            }

            // 2. Check daily limit with auto-reset
            let current_day = get_block_timestamp() / SECONDS_PER_DAY;
            let mut daily_spent = *policy.daily_spent;

            // Reset daily spending if it's a new day
            if current_day > *policy.last_reset_day {
                daily_spent = 0;
            }

            // Check if adding this transaction would exceed daily limit
            if daily_spent + amount > *policy.max_amount_per_day {
                return false;
            }

            true
        }

        /// Update daily spending counter
        fn update_daily_spending(
            self: @ComponentState<TContractState>,
            policy: @SessionPolicy,
            amount: u256,
        ) -> SessionPolicy {
            let current_day = get_block_timestamp() / SECONDS_PER_DAY;

            // Reset if new day
            if current_day > *policy.last_reset_day {
                SessionPolicy {
                    max_amount_per_tx: *policy.max_amount_per_tx,
                    max_amount_per_day: *policy.max_amount_per_day,
                    daily_spent: amount,
                    last_reset_day: current_day,
                }
            } else {
                // Add to existing daily spending
                SessionPolicy {
                    max_amount_per_tx: *policy.max_amount_per_tx,
                    max_amount_per_day: *policy.max_amount_per_day,
                    daily_spent: *policy.daily_spent + amount,
                    last_reset_day: *policy.last_reset_day,
                }
            }
        }

        /// Extract amount from calldata (for transfers and token operations)
        /// This is a simplified version - in production, you'd need to handle
        /// different token standards (ERC20, ERC721, etc.)
        fn extract_amount_from_calldata(
            self: @ComponentState<TContractState>,
            target: ContractAddress,
            selector: felt252,
            calldata: Span<felt252>,
        ) -> u256 {
            // For ERC20 transfers, amount is typically the second parameter
            // For native ETH transfers, it's in the call value
            // This is a simplified implementation

            // Common ERC20 transfer selector
            let transfer_selector = selector!("transfer");
            let transfer_from_selector = selector!("transferFrom");

            if selector == transfer_selector || selector == transfer_from_selector {
                // Amount is usually the last parameter in ERC20 transfers
                // Format: transfer(to: address, amount: u256) or transferFrom(from, to, amount)
                if calldata.len() >= 2 {
                    // Reconstruct u256 from two felt252 values (low, high)
                    let amount_low: u128 = (*calldata.at(calldata.len() - 2)).try_into().unwrap();
                    let amount_high: u128 = (*calldata.at(calldata.len() - 1)).try_into().unwrap();
                    return u256 { low: amount_low, high: amount_high };
                }
            }

            // Default to 0 if we can't extract amount
            0_u256
        }

        /// Validate that the session hasn't expired
        fn is_session_expired(
            self: @ComponentState<TContractState>,
            expires_at: u64,
        ) -> bool {
            get_block_timestamp() >= expires_at
        }
    }
}
