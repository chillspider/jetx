# Instruction

## Secret

# I. Setup

## 1.1 Setup password phase & secret

### Install sops

#### 1.1.1 Setup SOPS with MACOSX

```
brew install sops
```

### Install gpg

#### 1.1.2 Setup SOPS with MACOSX

```
brew install gpg
```

### Import GPG keys

#### Generate key (can be skip) | Should define password

> gpg --full-generate-key
> gpg --export-secret-keys  F97E43EAC9227568F3FD957B85E0C96B3F406203 > F97E43EAC9227568F3FD957B85E0C96B3F406203.asc

#### Import key

> gpg --import F97E43EAC9227568F3FD957B85E0C96B3F406203.asc

#### Trust key (can be skip)

```
gpg --edit-key <fingerprint>
gpg> addkey
select RSA (encrypt only)
```

## 1.2 Import kubeconfig and use current context

Import k8s config

> Copy kubeconfig.yaml to ~/.kube

Use current context

```
kubectl config set-context <context-name>
```

## 1.3 Setup Network Flannel (can be skip)

Install Network Pods Flannel (only need on new cluster platform)

```
kubectl apply -f https://raw.githubusercontent.com/coreos/flannel/master/Documentation/kube-flannel.yml
```

## 1.3 Import helm env

```
source .env
```

Add fingerprint into `.sops.yaml` file

```
GPG_TTY=$(tty)
export GPG_TTY
```

# II. Encrypt secrets.yaml (can be skip)

Create sops secrets.yaml file

```
sops --verbose helm_vars/w24/secrets.yaml
```

Edit sops secrets.yaml file

```
> sops helm_vars/w24/secrets.yaml
```

or using VSCode sops extension `https://marketplace.visualstudio.com/items?itemName=signageos.signageos-vscode-sops`

#### Install helm plugin

helm plugin install https://github.com/jkroepke/helm-secrets
helm plugin install https://github.com/databus23/helm-diff

# III. Initialize new zone

-   environment is DATACENTER
-   tenant is PROD / STAGING

## 3.1. init regcred to init dockerhub authentication

```

helmfile apply --file tenants/w24/prod.yaml --environment=w24 --log-level info --selector name=regcred
helmfile apply --file tenants/w24/dev.yaml --environment=w24 --log-level info --selector name=regcred
```


## 3.2. init cluster issuer & refresh certificates issuer

```
helmfile apply --file tenants/w24/default.yaml --environment=w24  --log-level info --selector name=dns-clusterissuer
```

## 3.3 init cert manager

```
helmfile apply --file tenants/w24/default.yaml  --log-level info --selector name=cert-manager
```

Need to setup Cloudflare DNS01 token

## 3.4. init ingress

```
helmfile apply --file tenants/w24/default.yaml --environment=w24  --log-level info --selector name=ingress-nginx

```

## 3.5. Install PVC

```
TODO
```

## 3.6. THIRD-PARTIES helmfile apply all third parties (redis, postgres)
### 3.6.1 THIRD-PARTIES for PROD
```
helmfile apply --file tenants/w24/prod.yaml --environment=w24   --log-level info --selector name=rabbitmq
helmfile apply --file tenants/w24/prod.yaml --environment=w24   --log-level info --selector name=postgres
helmfile apply --file tenants/w24/prod.yaml --environment=w24   --log-level info --selector name=redis
helmfile apply --file tenants/w24/prod.yaml --environment=w24   --log-level info --selector name=minio
helmfile apply --file tenants/w24/prod.yaml --environment=w24  --log-level info --selector name=emqx
```

### 3.6.2 THIRD-PARTIES for DEV
```
helmfile apply --file tenants/w24/dev.yaml --environment=w24   --log-level info --selector name=redis
helmfile apply --file tenants/w24/dev.yaml --environment=w24   --log-level info --selector name=emqx
helmfile apply --file tenants/w24/dev.yaml --environment=w24   --log-level info --selector name=postgres
```

# IV. Service deployment

SERVICES helmfile apply services (backend-api, voucher-api, app, replica-db-job)

## 4.1 W24 - PROD

```
helmfile apply --file tenants/w24/prod.yaml --environment=w24  --log-level info --selector name=app
helmfile apply --file tenants/w24/prod.yaml --environment=w24  --log-level info --selector name=voucher-api
helmfile apply --file tenants/w24/prod.yaml --environment=w24  --log-level info --selector name=backend-api
helmfile apply --file tenants/w24/prod.yaml --environment=w24  --log-level info --selector name=replica-db-job
helmfile apply --file tenants/w24/prod.yaml --environment=w24  --log-level info --selector name=car-detector-api
helmfile apply --file tenants/w24/prod.yaml --environment=w24  --log-level info --selector name=car-detector-web
helmfile apply --file tenants/w24/prod.yaml --environment=w24  --log-level info --selector name=kiosk-web
```

## 4.2 W24 - DEV

```
helmfile apply --file tenants/w24/dev.yaml --environment=w24  --log-level info --selector name=app
helmfile apply --file tenants/w24/dev.yaml --environment=w24  --log-level info --selector name=voucher-api
helmfile apply --file tenants/w24/dev.yaml --environment=w24  --log-level info --selector name=backend-api
helmfile apply --file tenants/w24/dev.yaml --environment=w24  --log-level info --selector name=replica-db-job
helmfile apply --file tenants/w24/dev.yaml --environment=w24  --log-level info --selector name=car-detector-api
helmfile apply --file tenants/w24/dev.yaml --environment=w24  --log-level info --selector name=car-detector-web
helmfile apply --file tenants/w24/dev.yaml --environment=w24  --log-level info --selector name=kiosk-web
```

# Other

## Prometheus

### First install

```
kubectl apply --server-side -f https://raw.githubusercontent.com/prometheus-operator/prometheus-operator/v0.59.1/example/prometheus-operator-crd/monitoring.coreos.com_alertmanagerconfigs.yaml
kubectl apply --server-side -f https://raw.githubusercontent.com/prometheus-operator/prometheus-operator/v0.59.1/example/prometheus-operator-crd/monitoring.coreos.com_alertmanagers.yaml
kubectl apply --server-side -f https://raw.githubusercontent.com/prometheus-operator/prometheus-operator/v0.59.1/example/prometheus-operator-crd/monitoring.coreos.com_podmonitors.yaml
kubectl apply --server-side -f https://raw.githubusercontent.com/prometheus-operator/prometheus-operator/v0.59.1/example/prometheus-operator-crd/monitoring.coreos.com_probes.yaml
kubectl apply --server-side -f https://raw.githubusercontent.com/prometheus-operator/prometheus-operator/v0.59.1/example/prometheus-operator-crd/monitoring.coreos.com_prometheuses.yaml
kubectl apply --server-side -f https://raw.githubusercontent.com/prometheus-operator/prometheus-operator/v0.59.1/example/prometheus-operator-crd/monitoring.coreos.com_prometheusrules.yaml
kubectl apply --server-side -f https://raw.githubusercontent.com/prometheus-operator/prometheus-operator/v0.59.1/example/prometheus-operator-crd/monitoring.coreos.com_servicemonitors.yaml
kubectl apply --server-side -f https://raw.githubusercontent.com/prometheus-operator/prometheus-operator/v0.59.1/example/prometheus-operator-crd/monitoring.coreos.com_thanosrulers.yaml
```

### Install Eraser Image Garbage collector

#### Wash24

```
helmfile apply --file tenants/w24/default.yaml  --log-level info --selector name=eraser
```

### Re-setup Prometheus

```
helmfile apply --file tenants/w24/default.yaml --environment=w24 --log-level info --selector name=prometheus
```

```
helmfile apply --file tenants/w24/default.yaml --environment=w24 --log-level info --selector name=loki
```
