import { generateMockData } from '../src/generateMockData';

describe('generateMockData', () => {
    test('should generate data with correct length', () => {
        const data = generateMockData(10, 123);
        expect(data).toHaveLength(10);
    });

    test('should be deterministic with same seed', () => {
        const data1 = generateMockData(5, 456);
        const data2 = generateMockData(5, 456);
        expect(data1).toEqual(data2);
    });

    test('should generate different data with different seeds', () => {
        const data1 = generateMockData(5, 456);
        const data2 = generateMockData(5, 789);
        expect(data1).not.toEqual(data2);
    });

    test('should have expected structure', () => {
        const data = generateMockData(1, 100);
        const item = data[0];
        expect(item).toHaveProperty('label');
        expect(item).toHaveProperty('x');
        expect(item).toHaveProperty('y');
        expect(item).toHaveProperty('z');
    });
});
