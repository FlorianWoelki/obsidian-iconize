interface CacheResult {
  iconNameWithPrefix: string;
  iconColor?: string;
  inCustomRule?: boolean;
  inFrontmatterRule?: boolean;
}

export class IconCache {
  private static instance: IconCache = new IconCache();
  private cache: Map<string, CacheResult> = new Map();

  constructor() {
    if (IconCache.instance) {
      throw new Error(
        'Error: Instantiation failed: Use `IconCache.getInstance()` instead of new.',
      );
    }

    IconCache.instance = this;
  }

  public set = (path: string, result: CacheResult): void => {
    this.cache.set(path, result);
  };

  public invalidate = (path: string): void => {
    this.cache.delete(path);
  };

  public clear = (): void => {
    this.cache.clear();
  };

  public get = (path: string): CacheResult | null => {
    return this.cache.get(path) ?? null;
  };

  public doesRecordExist = (path: string): boolean => {
    return this.get(path) !== null;
  };

  public static getInstance = (): IconCache => {
    return IconCache.instance;
  };
}
