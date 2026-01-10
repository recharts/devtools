import { generateMockMarketData } from '../src/generateMockMarketData.js';

describe('generateMockMarketData', () => {
    test('should generate data with correct length', () => {
        const data = generateMockMarketData(10, 123);
        expect(data).toHaveLength(10);
    });

    test('should be deterministic with same seed', () => {
        const data1 = generateMockMarketData(5, 456);
        const data2 = generateMockMarketData(5, 456);
        expect(data1).toEqual(data2);
    });

    test('should produce consistent OHLC values', () => {
        const data = generateMockMarketData(20, 789, 100, 1600000000000);
        for (let i = 0; i < data.length; i++) {
            const c = data[i];
            expect(c).toHaveProperty('time');
            expect(c).toHaveProperty('open');
            expect(c).toHaveProperty('close');
            expect(c).toHaveProperty('low');
            expect(c).toHaveProperty('high');

            // high must be >= max(open, close)
            expect(c.high).toBeGreaterThanOrEqual(Math.max(c.open, c.close));
            // low must be <= min(open, close)
            expect(c.low).toBeLessThanOrEqual(Math.min(c.open, c.close));
            // low should be positive
            expect(c.low).toBeGreaterThanOrEqual(0.01);
            // high should be >= low
            expect(c.high).toBeGreaterThanOrEqual(c.low);

            if (i > 0) {
                // open equals previous close
                expect(c.open).toBe(data[i - 1].close);
            }
        }
    });

    test('should use 15 minute intervals between candles', () => {
        const data = generateMockMarketData(3, 1010, 50, 1600000000000);
        const interval = 15 * 60 * 1000;
        expect(data[1].time - data[0].time).toBe(interval);
        expect(data[2].time - data[1].time).toBe(interval);
    });
});
