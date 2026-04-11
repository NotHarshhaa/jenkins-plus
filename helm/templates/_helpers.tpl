{{/*
Expand the name of the chart.
*/}}
{{- define "jenkins-plus.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "jenkins-plus.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart label.
*/}}
{{- define "jenkins-plus.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels.
*/}}
{{- define "jenkins-plus.labels" -}}
helm.sh/chart: {{ include "jenkins-plus.chart" . }}
{{ include "jenkins-plus.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels.
*/}}
{{- define "jenkins-plus.selectorLabels" -}}
app.kubernetes.io/name: {{ include "jenkins-plus.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Service account name.
*/}}
{{- define "jenkins-plus.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "jenkins-plus.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Jenkins URL: ingress host if enabled, otherwise the ClusterIP service.
*/}}
{{- define "jenkins-plus.url" -}}
{{- if .Values.jenkinsUrl }}
{{- .Values.jenkinsUrl }}
{{- else if .Values.ingress.enabled }}
{{- if .Values.ingress.tls }}
{{- printf "https://%s" .Values.ingress.host }}
{{- else }}
{{- printf "http://%s" .Values.ingress.host }}
{{- end }}
{{- else }}
{{- printf "http://%s:8080" (include "jenkins-plus.fullname" .) }}
{{- end }}
{{- end }}
