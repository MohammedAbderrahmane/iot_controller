CC = gcc
CFLAGS = -Ilibcoap/include/coap3
LDFLAGS = -Llibcoap -lcoap-3 -lssl -lcrypto -lpthread

coap_server: server.c
	$(CC) $(CFLAGS) -o $@ $< $(LDFLAGS)