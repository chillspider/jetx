const int LED_PIN = 18;
const int RELAY_ON_PIN = 19;
#include <WiFi.h>

const char* ssid = "WIFI8";     // Replace with your WiFi SSID
const char* password = "01689906274"; // Replace with your WiFi Password

// the setup function runs once when you press reset or power the board
void setup() {
  // initialize digital pin LED_BUILTIN on IO18 as an output.
  pinMode(LED_PIN, OUTPUT);
  pinMode(RELAY_ON_PIN, OUTPUT);

  // set baudrate at 115200
  Serial.begin(115200);

  WiFi.begin(ssid, password);
    
    Serial.print("Connecting to WiFi");
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }

    Serial.println("\nConnected to WiFi!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP()); // Print the local IP
}

// the loop function runs over and over again forever
void loop() {
  Serial.println("ON");
  digitalWrite(LED_PIN, HIGH); 
  // digitalWrite(RELAY_ON_PIN, HIGH);  // turn the LED on (HIGH is the voltage level)
  delay(5000);                      // wait for a second
  digitalWrite(LED_PIN, LOW);
  // digitalWrite(RELAY_ON_PIN, LOW);
  Serial.println("OFF");   // turn the LED off by making the voltage LOW
  delay(5000);                      // wait for a second
}