import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';

import { ISwaggerConfigInterface } from './interfaces';

export function setupSwagger(
  app: INestApplication,
  config: ISwaggerConfigInterface,
): OpenAPIObject {
  const documentBuilder = new DocumentBuilder()
    .setTitle(config.title)
    .setDescription(config.description)
    .addBearerAuth()
    .addBasicAuth();

  if (config.version) {
    documentBuilder.setVersion(config.version);
  }

  const document = SwaggerModule.createDocument(app, documentBuilder.build());

  SwaggerModule.setup(config.path, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      requestSnippetsEnabled: true,
    },
    jsonDocumentUrl: `${config.path}/json`,
    yamlDocumentUrl: `${config.path}/yaml`,
  });

  console.info(
    `Documentation: http://localhost:${process.env.PORT}/${config.path}`,
  );

  return document;
}
