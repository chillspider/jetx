/* eslint-disable max-classes-per-file */

class TranslationDto {
	[code: string]: Record<string, any>;
}

export class AttentionDto {
	id!: string;

	name!: string;

	featureImageUrl?: string;

	translations?: TranslationDto;

	constructor(id: string, name: string, featureImageUrl?: string, translations?: TranslationDto) {
		this.id = id;
		this.name = name;
		this.featureImageUrl = featureImageUrl;
		this.translations = translations;
	}
}
