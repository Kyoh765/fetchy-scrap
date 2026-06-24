# FetchyScrap — Railway Cron Service
FROM alpine:3.19

# curl pour les requêtes HTTP, tzdata pour les logs en heure locale
RUN apk add --no-cache curl tzdata

ENV TZ=Europe/Paris

WORKDIR /app
COPY run.sh .
RUN chmod +x run.sh

# Railway exécute CMD selon le schedule configuré dans le dashboard
CMD ["/app/run.sh"]
