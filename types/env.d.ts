declare module '@env' {
  export const MQTT_HOST: string;
  export const MQTT_PORT: string;
  export const MQTT_USERNAME: string;
  export const MQTT_PASSWORD: string;
  export const MQTT_TOPIC_XY: string;
  export const MQTT_TOPIC_BSK: string;

  export const INFLUX_HOST: string;
  export const INFLUX_DB: string;

  export const OPENMETEO_LATITUDE: string;
  export const OPENMETEO_LONGITUDE: string;

  export const TELEGRAM_BOT_TOKEN: string;
  export const TELEGRAM_CHAT_ID: string;

  export const GEMINI_API_KEY: string;
}
