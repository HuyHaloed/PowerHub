#include <PZEM004Tv30.h>
#include <HardwareSerial.h>

// Chân RXD2 và TXD2 được định nghĩa cho Serial2 trên YoloUno
#define RXD2 38 //Chân 11
#define TXD2 21 //chân 10
#define PZEM_SERIAL Serial2


PZEM004Tv30 pzem(PZEM_SERIAL, RXD2, TXD2);

void setup() {

  Serial.begin(115200);
  Serial2.begin(9600, SERIAL_8N1, RXD2, TXD2);
  
}

void loop() {
    float voltage = pzem.voltage();
    if(!isnan(voltage)){
        Serial.print("Voltage: "); Serial.print(voltage); Serial.println("V");
    } else {
        Serial.println("Error reading voltage");
    }

    float current = pzem.current();
    if(!isnan(current)){
        Serial.print("Current: "); Serial.print(current); Serial.println("A");
    } else {
        Serial.println("Error reading current");
    }

    float power = pzem.power();
    if(!isnan(power)){
        Serial.print("Power: "); Serial.print(power); Serial.println("W");
    } else {
        Serial.println("Error reading power");
    }

    float energy = pzem.energy();
    if(!isnan(energy)){
        Serial.print("Energy: "); Serial.print(energy,3); Serial.println("kWh");
    } else {
        Serial.println("Error reading energy");
    }

    float frequency = pzem.frequency();
    if(!isnan(frequency)){
        Serial.print("Frequency: "); Serial.print(frequency, 1); Serial.println("Hz");
    } else {
        Serial.println("Error reading frequency");
    }

    float pf = pzem.pf();
    if(!isnan(pf)){
        Serial.print("PF: "); Serial.println(pf);
    } else {
        Serial.println("Error reading power factor");
    }

    Serial.println();
    delay(500);
}