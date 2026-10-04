import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreateOrderApplicationDto } from './create-order-application.dto';
import { UpdateOrderApplicationDto } from './update-order-application.dto';

const priceErrors = (cls: new () => object, proposedPrice: unknown) =>
  validateSync(
    plainToInstance(cls, { message: 'Hello', proposedPrice }),
  ).filter((e) => e.property === 'proposedPrice');

describe.each([
  ['CreateOrderApplicationDto', CreateOrderApplicationDto],
  ['UpdateOrderApplicationDto', UpdateOrderApplicationDto],
])('%s proposedPrice', (_name, cls) => {
  it.each([1, 75000])('accepts the whole number %p', (price) => {
    expect(priceErrors(cls, price)).toHaveLength(0);
  });

  it('may be omitted', () => {
    expect(priceErrors(cls, undefined)).toHaveLength(0);
  });

  it.each([0, -5])('rejects %p (below 1)', (price) => {
    expect(priceErrors(cls, price)[0]?.constraints).toHaveProperty('min');
  });

  it('rejects a decimal instead of failing in the database', () => {
    expect(priceErrors(cls, 100.5)[0]?.constraints).toHaveProperty('isInt');
  });
});
