TARGET = converter

CC = grc -es --colour=auto gcc
CFLAGS = -g -fno-omit-frame-pointer -fmudflap -lmudflap -Wall -Wextra -pedantic -Wformat=2 -std=c99 -O3 -march=native -ftrapv -Wfloat-equal -Wundef -Wshadow -Wpointer-arith -Wcast-align -Wstrict-prototypes
LIBS = -lm

.PHONY: clean default all

default: $(TARGET)
all: default

OBJECTS = converter.o main.o

$(TARGET): $(OBJECTS)
	$(CC) $(OBJECTS) $(CFLAGS) $(LIBS) -o $@

clean:
	rm -f *.o
	rm -f $(TARGET)


