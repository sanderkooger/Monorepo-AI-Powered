path "{{ .Path }}/web-app/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}