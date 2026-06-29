import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { ShipStatus, isDocked, isAtSea } from './ShipStatus.js';

describe('ShipStatus enum', () => {
    it('should contain all four expected status values', () => {
        assert.equal(ShipStatus.IDLE,           'IDLE');
        assert.equal(ShipStatus.LOADING,        'LOADING');
        assert.equal(ShipStatus.IN_TRANSIT,     'IN_TRANSIT');
        assert.equal(ShipStatus.AWAITING_PILOT, 'AWAITING_PILOT');
    });

    it('should be frozen (immutable)', () => {
        assert.equal(Object.isFrozen(ShipStatus), true);
    });

    it('should throw when mutating (strict-mode ESM enforces freeze)', () => {
        assert.throws(
            () => Object.defineProperty(ShipStatus, 'IDLE', { value: 'SOMETHING_ELSE' }),
            TypeError
        );
    });
});

describe('isDocked()', () => {
    it('should return true for IDLE', () => {
        assert.equal(isDocked(ShipStatus.IDLE), true);
    });

    it('should return true for LOADING (ship is still in port with cargo)', () => {
        assert.equal(isDocked(ShipStatus.LOADING), true);
    });

    it('should return false for IN_TRANSIT', () => {
        assert.equal(isDocked(ShipStatus.IN_TRANSIT), false);
    });

    it('should return false for AWAITING_PILOT', () => {
        assert.equal(isDocked(ShipStatus.AWAITING_PILOT), false);
    });

    it('should return false for unknown/undefined status', () => {
        assert.equal(isDocked(undefined), false);
        assert.equal(isDocked(null), false);
        assert.equal(isDocked('DOCKED'), false);
        assert.equal(isDocked(''), false);
    });
});

describe('isAtSea()', () => {
    it('should return true for IN_TRANSIT', () => {
        assert.equal(isAtSea(ShipStatus.IN_TRANSIT), true);
    });

    it('should return true for AWAITING_PILOT', () => {
        assert.equal(isAtSea(ShipStatus.AWAITING_PILOT), true);
    });

    it('should return false for IDLE', () => {
        assert.equal(isAtSea(ShipStatus.IDLE), false);
    });

    it('should return false for LOADING', () => {
        assert.equal(isAtSea(ShipStatus.LOADING), false);
    });

    it('should return false for unknown/undefined status', () => {
        assert.equal(isAtSea(undefined), false);
        assert.equal(isAtSea(null), false);
        assert.equal(isAtSea('AT_SEA'), false);
        assert.equal(isAtSea(''), false);
    });
});

describe('isDocked / isAtSea completeness', () => {
    it('every valid ShipStatus is either docked or at sea (no status falls through)', () => {
        for (const status of Object.values(ShipStatus)) {
            const covered = isDocked(status) || isAtSea(status);
            assert.equal(covered, true, `Status '${status}' is neither docked nor at sea`);
        }
    });

    it('no status is both docked AND at sea simultaneously', () => {
        for (const status of Object.values(ShipStatus)) {
            const both = isDocked(status) && isAtSea(status);
            assert.equal(both, false, `Status '${status}' is incorrectly both docked and at sea`);
        }
    });
});
