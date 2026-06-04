export interface UpdateBettorDto {
	nick?: string
	bio?: string
	avatar?: File | null
}

export function toFormData(dto: UpdateBettorDto): FormData {
	const form = new FormData();
	if (dto.nick !== undefined) form.append('nick', dto.nick);
	if (dto.bio !== undefined) form.append('bio', dto.bio);
	if (dto.avatar !== undefined && dto.avatar !== null) form.append('avatar', dto.avatar);
	return form;
}


