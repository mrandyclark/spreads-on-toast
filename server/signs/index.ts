import { dbConnect } from '@/lib/mongoose';
import { SignModel } from '@/models/sign.model';
import { Sign, SignConfig, SignRole } from '@/types';

export interface CreateSignInput {
	config?: Partial<SignConfig>;
	owner: string;
	title: string;
}

export interface UpdateSignInput {
	config?: Partial<SignConfig>;
	title?: string;
}

export async function createSign(input: CreateSignInput): Promise<Sign> {
	await dbConnect();

	const sign = await SignModel.create({
		config: input.config,
		members: [{ joinedAt: new Date(), role: SignRole.Owner, user: input.owner }],
		owner: input.owner,
		title: input.title,
	});

	return sign.toJSON() as Sign;
}

export async function getSignById(id: string): Promise<Sign | null> {
	await dbConnect();

	const sign = await SignModel.findById(id);

	return (sign?.toJSON() as Sign) ?? null;
}

export async function getSignsByUser(userId: string): Promise<Sign[]> {
	await dbConnect();

	const signs = await SignModel.find({ 'members.user': userId }).sort({ createdAt: -1 });

	return signs.map((sign) => sign.toJSON() as Sign);
}

export async function updateSign(id: string, input: UpdateSignInput): Promise<Sign | null> {
	await dbConnect();

	const updateFields: Record<string, unknown> = {};

	Object.entries(input).forEach(([key, value]) => {
		if (value === undefined) {
			return;
		}

		// Flatten nested config fields to dot notation for partial updates
		if (key === 'config' && typeof value === 'object') {
			Object.entries(value as Record<string, unknown>).forEach(([section, sectionValue]) => {
				if (sectionValue && typeof sectionValue === 'object') {
					Object.entries(sectionValue as Record<string, unknown>).forEach(([field, fieldValue]) => {
						if (fieldValue !== undefined) {
							updateFields[`config.${section}.${field}`] = fieldValue;
						}
					});
				}
			});

			return;
		}

		updateFields[key] = value;
	});

	if (Object.keys(updateFields).length === 0) {
		return getSignById(id);
	}

	const sign = await SignModel.findByIdAndUpdate(id, { $set: updateFields }, { new: true });

	return (sign?.toJSON() as Sign) ?? null;
}

export async function deleteSign(id: string): Promise<boolean> {
	await dbConnect();

	const result = await SignModel.findByIdAndDelete(id);

	return !!result;
}

export async function isSignMember(signId: string, userId: string): Promise<boolean> {
	await dbConnect();

	const sign = await SignModel.findOne({ _id: signId, 'members.user': userId });

	return !!sign;
}

export async function isSignOwner(signId: string, userId: string): Promise<boolean> {
	await dbConnect();

	const sign = await SignModel.findOne({ _id: signId, owner: userId });

	return !!sign;
}

export async function addSignMember(
	signId: string,
	userId: string,
	role: SignRole = SignRole.Viewer,
): Promise<Sign | null> {
	await dbConnect();

	const sign = await SignModel.findById(signId);

	if (!sign) {
		return null;
	}

	// Check if user is already a member
	const isMember = sign.members.some((m) => m.user.toString() === userId);

	if (isMember) {
		return sign.toJSON() as Sign;
	}

	sign.members.push({
		joinedAt: new Date(),
		role,
		user: userId as unknown as Sign['members'][0]['user'],
	});

	await sign.save();

	return sign.toJSON() as Sign;
}

export async function removeSignMember(signId: string, userId: string): Promise<Sign | null> {
	await dbConnect();

	const sign = await SignModel.findByIdAndUpdate(
		signId,
		{ $pull: { members: { user: userId } } },
		{ new: true },
	);

	return (sign?.toJSON() as Sign) ?? null;
}
