import { PackageDto } from '../dtos/package.dto';
import { PackageStatus } from '../enums/package-status.enum';

export class PackageUtils {
  static canAccessPackage(pkg: PackageDto, email: string): boolean {
    if (!pkg || !email) return false;

    if (pkg.status !== PackageStatus.PUBLISH) {
      return false;
    }

    const blacklist = pkg.blacklist || [];
    if (blacklist.length && blacklist.includes(email)) {
      return false;
    }

    const targets = pkg.targets || [];
    return !targets.length || targets.includes(email);
  }
}
