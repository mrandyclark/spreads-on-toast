import { Ref } from '@/types/mongo';

export function populatedToId<T extends { id: string }>(ref?: Ref<T>): string | undefined {
	return ref ? (typeof ref === 'string' ? ref : ref.id) : undefined;
}

export function populatedArrayToId<T extends { id: string }>(refs?: Ref<T>[]): string[] {
	return refs?.map(populatedToId).filter((id) => id !== undefined) ?? [];
}
