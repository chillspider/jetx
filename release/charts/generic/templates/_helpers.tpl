{{/*
Expand the name of the chart.
*/}}
{{- define "generic.name" -}}
{{- default .Release.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Expand the name of a cron job
*/}}
{{- define "generic.cronName" -}}
{{- printf "%s-%s" .name (default .Release.Name .Values.nameOverride) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "generic.fullname" -}}
{{- printf "%s" .Release.Name | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "generic.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "generic.labels" -}}
helm.sh/chart: {{ include "generic.chart" . }}
zodinet.com/app: {{ .Release.Name }}
zodinet.com/chartName: {{ .Chart.Name }}
zodinet.com/release: {{ .Release.Name }}
zodinet.com/heritage: {{ .Release.Service }}
zodinet.com/version: "{{ .Values.image.tag }}"
zodinet.com/datacenter: {{ .Values.datacenter }}
zodinet.com/tenant: {{ .Values.tenant }} 
{{ include "generic.selectorLabels" . }}
app.kubernetes.io/version: "{{ .Values.image.tag }}"
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}


{{/*
CronJob labels
*/}}
{{- define "generic.cronLabels" -}}
helm.sh/chart: {{ include "generic.chart" . }}
zodinet.com/app: {{ .Release.Name }}
zodinet.com/chartName: {{ .Chart.Name }}
zodinet.com/release: {{ .Release.Name }}
zodinet.com/heritage: {{ .Release.Service }}
zodinet.com/version: "{{ .Values.image.tag }}"
zodinet.com/datacenter: {{ .Values.datacenter }}
zodinet.com/tenant: {{ .Values.tenant }}
app.kubernetes.io/name: {{ include "generic.cronName" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: "{{ .Values.image.tag }}"
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "generic.selectorLabels" -}}
app.kubernetes.io/name: {{ include "generic.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "generic.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "generic.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Create List of hosts
*/}}
{{- define "generic.ingressHosts" -}}
{{- $output := list }}
{{- range $_, $domain := $.Values.ingress.domains }}
  {{- range $_, $subdomain := $.Values.ingress.subdomains }}
    {{- $output = append $output ( tpl (printf "%s.%s" $subdomain $domain) $ | quote ) }}
  {{- end }}
{{- end }}
{{/*
All outputs from templates are strings, so we
need to serialize and deserialize the list as JSON
*/}}
{{- toJson $output }}
{{- end }}
