export class UpdateUserDto {
	firstName?: string;

	lastName?: string;

	phone?: string;

	constructor(init?: Partial<UpdateUserDto>) {
		if (init) {
			this.firstName = init.firstName;
			this.lastName = init.lastName;
			this.phone = init.phone;
		}
	}
}
