import * as ExcelJS from 'exceljs';

export interface IWorksheetOptions {
  title: string;
}

export interface IRowOptions {
  fillColor: string;
  bold: boolean;
}

export interface IWorkBookOptions {
  headerRowFillColor: string;
  defaultFillColor: string;
}

export class Excel {
  workbook: ExcelJS.Workbook;
  defaultFillColor: string;
  headerRowFillColor: string;

  constructor(options?: IWorkBookOptions) {
    this.workbook = new ExcelJS.Workbook();
    this.workbook.created = new Date();
    this.workbook.modified = new Date();
    this.headerRowFillColor = options?.headerRowFillColor || 'FFFFFF';
    this.defaultFillColor = options?.defaultFillColor || 'FFFFFF';
  }

  async addWorkSheet(options: IWorksheetOptions) {
    return this.workbook.addWorksheet(options.title, {
      pageSetup: {
        horizontalCentered: true,
        verticalCentered: true,
        margins: {
          left: 2,
          right: 2,
          top: 4,
          bottom: 4,
          header: 2,
          footer: 2,
        },
      },
    });
  }

  async addHeaderRow(worksheet: ExcelJS.Worksheet, headerRowData: string[]) {
    worksheet.addRow(headerRowData.map((row) => row));
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: this.headerRowFillColor },
    };
    worksheet.getRow(1).font = {
      size: 12,
      bold: true,
      name: 'Arial',
      family: 2,
      color: { argb: '000000', theme: 2 },
    };
    worksheet.getRow(1).border = {
      top: { style: 'thin', color: { argb: 'E8E8E8' } },
      bottom: { style: 'thin', color: { argb: 'E8E8E8' } },
      left: { style: 'thin', color: { argb: 'E8E8E8' } },
      right: { style: 'thin', color: { argb: 'E8E8E8' } },
    };
  }

  async addRow(
    worksheet: ExcelJS.Worksheet,
    data: string[],
    options: IRowOptions,
  ) {
    worksheet.addRow(data);
    worksheet.getRow(worksheet.rowCount).font = {
      size: 13,
      bold: options.bold || false,
    };
    worksheet.getRow(worksheet.rowCount).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: options.fillColor || this.defaultFillColor },
    };
    worksheet.getRow(worksheet.rowCount).alignment = {
      vertical: 'middle',
      horizontal: 'left',
      wrapText: true,
    };
    worksheet.getRow(worksheet.rowCount).border = {
      top: { style: 'thin', color: { argb: 'E8E8E8' } },
      bottom: { style: 'thin', color: { argb: 'E8E8E8' } },
      left: { style: 'thin', color: { argb: 'E8E8E8' } },
      right: { style: 'thin', color: { argb: 'E8E8E8' } },
    };

    this.adjustColumnWidth(worksheet);
  }

  private adjustColumnWidth(worksheet: ExcelJS.Worksheet) {
    worksheet.columns.forEach((column) => {
      let maxLength = 10; // Default minimum width

      column.eachCell({ includeEmpty: true }, (cell) => {
        const cellValue = cell.value?.toString() || '';
        maxLength = Math.max(maxLength, cellValue.length);
      });

      column.width = maxLength + 2; // Add some padding
    });
  }
}
