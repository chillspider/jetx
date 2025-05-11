import { HttpModule } from '@nestjs/axios';
import { DynamicModule, Module, Provider, ValueProvider } from '@nestjs/common';

import { EASY_INVOICE_OPTIONS } from './constants/easy-invoice-option.constant';
import { IEasyInvoiceAsyncOptions } from './interfaces/easy-invoice-options-async-provider.interface';
import { IEasyInvoiceOptionsFactory } from './interfaces/easy-invoice-options-factory.interface';
import { IEasyInvoiceOptions } from './interfaces/easy-invoice-options-provider.interface';
import { EasyInvoiceFactoryService } from './services/easy-invoice-factory.service';

const moduleProviders = [EasyInvoiceFactoryService];
const exporters = [EasyInvoiceFactoryService];
const importers = [HttpModule];

@Module({
  imports: importers,
  providers: moduleProviders,
  exports: exporters,
})
export class EasyInvoiceModule {
  static forRoot(options: IEasyInvoiceOptions): DynamicModule {
    const databaseOptionsProvider: ValueProvider<IEasyInvoiceOptions> = {
      provide: EASY_INVOICE_OPTIONS,
      useValue: options,
    };

    return {
      module: EasyInvoiceModule,
      imports: [...importers],
      providers: [databaseOptionsProvider, ...moduleProviders],
      exports: exporters,
    };
  }

  public static forRootAsync(options: IEasyInvoiceAsyncOptions): DynamicModule {
    const providers: Provider[] = this.createAsyncProviders(options);
    return {
      module: EasyInvoiceModule,
      imports: [...importers, ...(options.imports ?? [])],
      providers: [
        ...providers,
        ...moduleProviders,
        ...(options.extraProviders || []),
      ],
      exports: exporters,
    };
  }

  private static createAsyncProviders(
    options: IEasyInvoiceAsyncOptions,
  ): Provider[] {
    const providers: Provider[] = [this.createAsyncOptionsProvider(options)];

    if (options.useClass) {
      providers.push({
        provide: options.useClass,
        useClass: options.useClass,
      });
    }

    return providers;
  }

  private static createAsyncOptionsProvider(
    options: IEasyInvoiceAsyncOptions,
  ): Provider {
    if (options.useFactory) {
      return {
        name: EASY_INVOICE_OPTIONS,
        provide: EASY_INVOICE_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }

    return {
      name: EASY_INVOICE_OPTIONS,
      provide: EASY_INVOICE_OPTIONS,
      useFactory: async (optionsFactory: IEasyInvoiceOptionsFactory) => {
        return optionsFactory.createOptions();
      },
      inject: [options.useExisting! || options.useClass!],
    };
  }
}
