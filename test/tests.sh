# Testing servers : CoAP 

coap-client -m get coap://192.168.1.100:5683/

coap-client -m get -v 8 coap://192.168.1.100:5683/whoami

coap-client -m get -s 50 coap://192.168.1.100:5683/observable

coap-client -m post -e Salam coap://192.168.1.100:5683/withpayload

# Testing servers : OSCORE

coap-client -m get -E .oscore-client,.oscore-client_seq coap://192.168.1.100:5683/

coap-client -m get -E .oscore-client,.oscore-client_seq -v 8 coap://192.168.1.100:5683/whoami

coap-client -m get -E .oscore-client,.oscore-client_seq -s 50 coap://192.168.1.100:5683/observable

coap-client -m post -e Salam -E .oscore-client,.oscore-client_seq coap://192.168.1.100:5683/withpayload

# Testing clients : CoAP

coap-server -E -A 192.168.1.100

# Testing Clients : OSCORE

coap-server -E .oscore-server -A 192.168.1.100

coap-server -E .oscore-server -v 8 -A 192.168.1.100