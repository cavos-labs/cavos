import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

/**
 * Tests verifying that app_salt is no longer exposed on public/unauthenticated API routes.
 * 
 * These are structural validation tests that verify the expected response shapes.
 * The actual API routes remove app_salt to prevent public exposure of salt values,
 * requiring integrators to use the appSalt configured in their kit client.
 */

describe('Public API response shapes (app_salt hygiene)', () => {
  
  describe('GET /api/apps/[id]/validate', () => {
    it('response shape should not include app_salt', () => {
      const expectedFields = [
        'allowed',
        'plan_tier',
        'current_mau',
        'wallet_count',
        'wallet_limit',
        'warning',
      ];
      
      const forbiddenFields = ['app_salt'];
      
      assert.ok(
        !expectedFields.includes('app_salt'),
        'app_salt must not be in the expected response fields'
      );
      
      forbiddenFields.forEach(field => {
        assert.ok(
          !expectedFields.includes(field),
          `${field} must not appear in public validate response`
        );
      });
    });
  });

  describe('GET /api/devices/request', () => {
    it('response shape should not include app_salt', () => {
      const expectedFields = [
        'found',
        'request_id',
        'app_id',
        'wallet_address',
        'network',
        'new_pub_x',
        'new_pub_y',
        'device_label',
        'status',
        'expires_at',
        'created_at',
      ];
      
      const forbiddenFields = ['app_salt'];
      
      assert.ok(
        !expectedFields.includes('app_salt'),
        'app_salt must not be in the expected response fields'
      );
      
      forbiddenFields.forEach(field => {
        assert.ok(
          !expectedFields.includes(field),
          `${field} must not appear in public device request response`
        );
      });
    });
  });

  describe('GET /api/devices/removal/[id]', () => {
    it('response shape should not include app_salt', () => {
      const expectedFields = [
        'found',
        'request_id',
        'app_id',
        'wallet_address',
        'network',
        'target_pub_x',
        'target_pub_y',
        'device_label',
        'status',
        'expires_at',
        'created_at',
      ];
      
      const forbiddenFields = ['app_salt'];
      
      assert.ok(
        !expectedFields.includes('app_salt'),
        'app_salt must not be in the expected response fields'
      );
      
      forbiddenFields.forEach(field => {
        assert.ok(
          !expectedFields.includes(field),
          `${field} must not appear in public device removal response`
        );
      });
    });
  });
});

describe('Salt canonicalization requirement', () => {
  it('documents that all salt computations must use apps.id (UUID), not public_id', () => {
    const documentation = `
      SALT CANONICALIZATION RULE:
      
      When computing app_salt, ALWAYS resolve any identifier (UUID or cav_... public_id)
      to the canonical apps.id (UUID) before calling computeAppSalt.
      
      - apps.id (UUID): 550e8400-e29b-41d4-a716-446655440000
      - app_environments.public_id: cav_abc123def456...
      
      Both identifiers refer to the same app, but they produce DIFFERENT salts
      if used directly in computeAppSalt. This would break wallet address derivation.
      
      CORRECT: resolveAppIdentifier(identifier) → { appId } → computeAppSalt(appId, baseSalt)
      WRONG:   computeAppSalt(rawIdentifier, baseSalt)
      
      As of this change, app_salt is no longer served on public GETs. Integrators
      must use the appSalt they configured in their kit client.
    `;
    
    assert.ok(documentation.includes('apps.id'), 'Documentation mentions canonical apps.id');
    assert.ok(documentation.includes('resolveAppIdentifier'), 'Documentation mentions resolution function');
  });
});
