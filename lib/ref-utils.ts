import { Ref } from '@/types/mongo';

export function resolveRef<T>(ref: Ref<T>): null | T {
	return typeof ref === 'object' ? ref : null;
}

export function resolveRefId<T extends { id: string }>(ref: Ref<T>): string;
export function resolveRefId<T extends { id: string }>(ref?: Ref<T>): string | undefined;

export function resolveRefId<T extends { id: string }>(ref?: Ref<T>): string | undefined {
	return ref ? (typeof ref === 'string' ? ref : ref.id) : undefined;
}

export function resolveRefIds<T extends { id: string }>(refs?: Ref<T>[]): string[] {
	return refs?.map((r) => resolveRefId(r)!).filter((id) => id !== undefined) ?? [];
}
