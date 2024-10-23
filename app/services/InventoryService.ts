
type InventoryServiceResult =
  | 'INSUFFICIENT_INVENTORY'
  | 'INVENTORY_ALLOCATIONS_NOT_FOUND';

interface InventoryServiceArgs {
    failureReason: string;
  }

export class InventoryService {
  failureReason: string;

  constructor({
    failureReason,
  }: InventoryServiceArgs) {
    this.failureReason = failureReason;
  }

  async run(): Promise<InventoryServiceResult> {
    const {failureReason} = this;
    return failureReason as InventoryServiceResult;
  }
}

