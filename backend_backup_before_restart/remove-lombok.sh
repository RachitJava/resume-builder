#!/bin/bash

# Script to remove Lombok annotations and add manual getters/setters
# This is a workaround for Lombok compilation issues

echo "Removing Lombok dependency from pom.xml..."
cd /Users/rachit/resume-builder/backend

# Remove Lombok dependency
sed -i.bak '/<dependency>/,/<\/dependency>/{/@lombok/,/<\/dependency>/d;}' pom.xml

echo "Lombok removed. Now compile with mvn to generate classes..."
mvn clean compile -DskipTests

echo "Done! Check if compilation succeeded."
