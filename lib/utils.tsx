export type CallbackAction<T> = (state: T) => T
export type UpdateAction<T> = CallbackAction<T> | T
export type UpdateFn<T> = (update: UpdateAction<T>) => void


export function assert(condition: unknown, message?: string): asserts condition {
	if (!condition) {
		throw new Error(message ?? 'Assertion error')
	}
}


export function deepMerge<T>(prev: T, next: Partial<T>): T {
    // 1. どちらも配列なら置き換える・結合するなど
    if (Array.isArray(prev) && Array.isArray(next)) {
      // 必要に応じて「置き換え」か「concat」かなどを選ぶ
      return next as T;
    }
  
    // 2. どちらもオブジェクトなら、再帰的にキーをマージ
    if (
      prev &&
      typeof prev === "object" &&
      next &&
      typeof next === "object" &&
      !Array.isArray(next)
    ) {
      const result = { ...prev } as Record<string, any>;
      for (const [key, val] of Object.entries(next)) {
        result[key] = deepMerge((result[key] as unknown) ?? {}, val);
      }
      return result as T;
    }
  
    // 3. それ以外は next で上書き    
    return next as T;
  }
