import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { filterShipsForPort, canRefuelShip, canRepairShip } from './harbourUtils.js';

const PORT_A = 'port-lisbon';
const PORT_B = 'port-hamburg';
const PORT_C = 'port-rotterdam';

function makeShip(overrides = {}) {
    return {
        id:              'ship-1',
        name:            'Test Ship',
        status:          'IDLE',
        currentPortId:   PORT_A,
        destinationPortId: null,
        fuelLevel:       80,
        healthPoints:    90,
        ...overrides,
    };
}

describe('filterShipsForPort()', () => {

    it('gibt ein leeres Array zurück wenn fleet leer ist', () => {
        assert.deepEqual(filterShipsForPort([], PORT_A), []);
    });

    it('gibt ein leeres Array zurück wenn portId null/undefined ist', () => {
        const fleet = [makeShip()];
        assert.deepEqual(filterShipsForPort(fleet, null), []);
        assert.deepEqual(filterShipsForPort(fleet, undefined), []);
        assert.deepEqual(filterShipsForPort(fleet, ''), []);
    });

    it('gibt ein leeres Array zurück wenn fleet kein Array ist', () => {
        assert.deepEqual(filterShipsForPort(null, PORT_A), []);
        assert.deepEqual(filterShipsForPort(undefined, PORT_A), []);
    });

    it('zeigt ein gedocktes Schiff am richtigen Hafen (IDLE)', () => {
        const fleet = [makeShip({ status: 'IDLE', currentPortId: PORT_A })];
        const result = filterShipsForPort(fleet, PORT_A);
        assert.equal(result.length, 1);
        assert.equal(result[0].currentPortId, PORT_A);
    });

    it('zeigt ein gedocktes Schiff am richtigen Hafen (LOADING)', () => {
        const fleet = [makeShip({ status: 'LOADING', currentPortId: PORT_A })];
        const result = filterShipsForPort(fleet, PORT_A);
        assert.equal(result.length, 1);
    });

    it('zeigt ein AT SEA Schiff das von diesem Hafen losgefahren ist (IN_TRANSIT)', () => {
        const fleet = [makeShip({
            status:            'IN_TRANSIT',
            currentPortId:     PORT_A,
            destinationPortId: PORT_B,
        })];
        const result = filterShipsForPort(fleet, PORT_A);
        assert.equal(result.length, 1, 'AT SEA Schiff muss beim Abfahrtshafen angezeigt werden');
    });

    it('zeigt ein AT SEA Schiff (AWAITING_PILOT) beim Abfahrtshafen', () => {
        const fleet = [makeShip({
            status:            'AWAITING_PILOT',
            currentPortId:     PORT_A,
            destinationPortId: PORT_B,
        })];
        const result = filterShipsForPort(fleet, PORT_A);
        assert.equal(result.length, 1);
    });

    it('blendet ein Schiff eines anderen Hafens aus', () => {
        const fleet = [makeShip({ currentPortId: PORT_B })];
        const result = filterShipsForPort(fleet, PORT_A);
        assert.equal(result.length, 0, 'Schiff von PORT_B darf in PORT_A View nicht erscheinen');
    });

    it('blendet ein AT SEA Schiff aus, das NICHT von diesem Hafen abgefahren ist', () => {
        const fleet = [makeShip({
            status:            'IN_TRANSIT',
            currentPortId:     PORT_B,
            destinationPortId: PORT_C,
        })];
        const result = filterShipsForPort(fleet, PORT_A);
        assert.equal(result.length, 0);
    });

    it('trennt korrekt wenn mehrere Schiffe aus verschiedenen Häfen vorhanden sind', () => {
        const fleet = [
            makeShip({ id: 's1', currentPortId: PORT_A, status: 'IDLE' }),
            makeShip({ id: 's2', currentPortId: PORT_A, status: 'IN_TRANSIT', destinationPortId: PORT_B }),
            makeShip({ id: 's3', currentPortId: PORT_B, status: 'IDLE' }),
            makeShip({ id: 's4', currentPortId: PORT_C, status: 'IN_TRANSIT', destinationPortId: PORT_A }),
        ];
        const resultA = filterShipsForPort(fleet, PORT_A);
        assert.equal(resultA.length, 2, 'PORT_A sollte 2 Schiffe sehen (s1 + s2)');
        assert.ok(resultA.some(s => s.id === 's1'));
        assert.ok(resultA.some(s => s.id === 's2'));

        const resultB = filterShipsForPort(fleet, PORT_B);
        assert.equal(resultB.length, 1, 'PORT_B sollte nur s3 sehen');
        assert.equal(resultB[0].id, 's3');

        const resultC = filterShipsForPort(fleet, PORT_C);
        assert.equal(resultC.length, 1, 'PORT_C sollte nur s4 sehen');
        assert.equal(resultC[0].id, 's4');
    });

    it('wenn Schiff ankommt (currentPortId wechselt zu Zielhafen) verschwindet es aus altem Hafen', () => {
        const arrivedShip = makeShip({
            id:            's-arrived',
            status:        'IDLE',
            currentPortId: PORT_B,
        });

        const resultOldPort = filterShipsForPort([arrivedShip], PORT_A);
        assert.equal(resultOldPort.length, 0, 'Schiff muss aus altem Hafen verschwinden');

        const resultNewPort = filterShipsForPort([arrivedShip], PORT_B);
        assert.equal(resultNewPort.length, 1, 'Schiff muss im neuen Hafen erscheinen');
    });
});

describe('canRefuelShip()', () => {

    it('gibt false zurück wenn ship null/undefined ist', () => {
        assert.equal(canRefuelShip(null), false);
        assert.equal(canRefuelShip(undefined), false);
    });

    it('gibt true zurück wenn Schiff gedockt und Fuel < 100', () => {
        assert.equal(canRefuelShip(makeShip({ status: 'IDLE', fuelLevel: 80 })), true);
        assert.equal(canRefuelShip(makeShip({ status: 'LOADING', fuelLevel: 0 })), true);
        assert.equal(canRefuelShip(makeShip({ status: 'IDLE', fuelLevel: 99 })), true);
    });

    it('gibt false zurück wenn Schiff gedockt und Fuel = 100 (bereits voll)', () => {
        assert.equal(canRefuelShip(makeShip({ status: 'IDLE', fuelLevel: 100 })), false);
    });

    it('gibt false zurück wenn Schiff AT SEA ist (unabhängig vom Fuel-Level)', () => {
        assert.equal(canRefuelShip(makeShip({ status: 'IN_TRANSIT',     fuelLevel: 50 })), false);
        assert.equal(canRefuelShip(makeShip({ status: 'AWAITING_PILOT', fuelLevel: 10 })), false);
        assert.equal(canRefuelShip(makeShip({ status: 'IN_TRANSIT',     fuelLevel: 0  })), false);
    });

    it('behandelt fehlendes fuelLevel als 0 (nachfüllbar)', () => {
        const ship = makeShip({ status: 'IDLE' });
        delete ship.fuelLevel;
        assert.equal(canRefuelShip(ship), true);
    });
});

describe('canRepairShip()', () => {

    it('gibt false zurück wenn ship null/undefined ist', () => {
        assert.equal(canRepairShip(null), false);
        assert.equal(canRepairShip(undefined), false);
    });

    it('gibt true zurück wenn Schiff gedockt und HP < 100', () => {
        assert.equal(canRepairShip(makeShip({ status: 'IDLE',    healthPoints: 80 })), true);
        assert.equal(canRepairShip(makeShip({ status: 'LOADING', healthPoints: 1  })), true);
        assert.equal(canRepairShip(makeShip({ status: 'IDLE',    healthPoints: 99 })), true);
    });

    it('gibt false zurück wenn Schiff gedockt und HP = 100 (bereits ok)', () => {
        assert.equal(canRepairShip(makeShip({ status: 'IDLE', healthPoints: 100 })), false);
    });

    it('gibt false zurück wenn Schiff AT SEA ist (unabhängig von HP)', () => {
        assert.equal(canRepairShip(makeShip({ status: 'IN_TRANSIT',     healthPoints: 10 })), false);
        assert.equal(canRepairShip(makeShip({ status: 'AWAITING_PILOT', healthPoints: 50 })), false);
    });

    it('behandelt fehlendes healthPoints als 100 (kein Repair nötig)', () => {
        const ship = makeShip({ status: 'IDLE' });
        delete ship.healthPoints;
        assert.equal(canRepairShip(ship), false);
    });
});
