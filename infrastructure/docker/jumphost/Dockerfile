# Use a minimal Alpine Linux base image
FROM alpine:latest

# Install OpenSSH, curl, and jq (for JSON parsing)
RUN apk update && apk add --no-cache openssh-server openssh-client curl jq

# Create a non-root user for SSH access
# Replace 'jumpuser' with your desired username
RUN adduser -D ansible && \
    passwd -u ansible # Unlock the user account

# Create SSH directory for the user and set permissions
RUN mkdir /home/ansible/.ssh && \
    chown ansible:ansible /home/ansible/.ssh && \
    chmod 700 /home/ansible/.ssh

# Directory to store the Vault CA public key
RUN mkdir /etc/ssh/trusted-user-ca-keys

# Copy the startup script into the image
COPY start.sh /usr/local/bin/start.sh

# Set permissions for the startup script
RUN chmod +x /usr/local/bin/start.sh

# Expose the SSH port (using 2222 as discussed)
EXPOSE 2222

# Configure SSH server to listen on port 2222 and use Vault CA
RUN sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin no/' /etc/ssh/sshd_config && \
    sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config && \
    echo "Port 2222" >> /etc/ssh/sshd_config && \
    echo "TrustedUserCAKeys /etc/ssh/trusted-user-ca-keys/vault_ca.pub" >> /etc/ssh/sshd_config && \
    echo "AllowUsers ansible" >> /etc/ssh/sshd_config && \
    sed -i 's/AllowTcpForwarding no/AllowTcpForwarding yes/' /etc/ssh/sshd_config && \
    sed -i 's/PermitTunnel no/PermitTunnel yes/' /etc/ssh/sshd_config # Enable TCP forwarding and tunneling

# Ensure SSH host keys are generated on first run if they don't exist
RUN ssh-keygen -A

# Set the entrypoint to the startup script
ENTRYPOINT ["/usr/local/bin/start.sh"]