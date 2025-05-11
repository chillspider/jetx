ARG ALPINE_VERSION
FROM alpine:${ALPINE_VERSION}

LABEL maintainer="Linh Ho <linh@zodinet.com>"
ARG TARGETARCH

ADD install.sh install.sh
RUN sh install.sh && rm install.sh

ENV SOURCE_DATABASE **None**
ENV SOURCE_HOST **None**
ENV SOURCE_PORT **None**
ENV SOURCE_USER **None**
ENV SOURCE_PASSWORD **None**

ENV TARGET_DATABASE **None**
ENV TARGET_HOST **None**
ENV TARGET_PORT **None**
ENV TARGET_USER **None**
ENV TARGET_PASSWORD **None**

ADD run.sh run.sh
ADD replica.sh replica.sh

ENTRYPOINT []
CMD ["sh", "run.sh"]
