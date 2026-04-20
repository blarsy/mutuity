FROM postgres:16

RUN set -eux; \
  apt-get update; \
  apt-get install -y --no-install-recommends wget gnupg ca-certificates; \
  echo "deb http://apt.postgresql.org/pub/repos/apt/ bookworm-pgdg main" > /etc/apt/sources.list.d/pgdg.list; \
  wget -qO- https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor > /etc/apt/trusted.gpg.d/postgresql.gpg; \
  apt-get update; \
  apt-get install -y --no-install-recommends postgresql-16-plpgsql-check; \
  rm -rf /var/lib/apt/lists/*
