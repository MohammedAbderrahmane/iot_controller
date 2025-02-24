#include "libcoap/include/coap3/coap.h"
#include <arpa/inet.h>
#include <stdio.h>
#include <stdlib.h>

typedef void (*coap_method_handler_t)(coap_resource_t *resource, coap_session_t *session,
                                      const coap_pdu_t *request, const coap_string_t *query,
                                      coap_pdu_t *response);

coap_context_t *create_coap_context(const char *address_ip, const char *port) {
    coap_context_t *coap_context = NULL;

    coap_address_t address;
    coap_address_init(&address);
    address.addr.sin.sin_family = AF_INET;
    address.addr.sin.sin_port = htons(atoi(port));

    inet_pton(AF_INET, address_ip, &address.addr.sin.sin_addr);

    coap_context = coap_new_context(&address);
    if (!coap_context) {
        fprintf(stderr, "Failed to create CoAP context.\n");
        exit(EXIT_FAILURE);
    }

    return coap_context;
}

void start_coap_server(coap_context_t *context) {
    while (1) {
        coap_io_process(context, COAP_IO_WAIT);
    }
}

void register_coap_resource(coap_context_t *context, const char *resource_name,
                            const coap_request_t method, coap_method_handler_t resource_handler) {
    coap_resource_t *resource = coap_resource_init(coap_make_str_const(resource_name), 0);
    coap_register_handler(resource, method, resource_handler);
    coap_add_resource(context, resource);
}

// resources

void hello_resource(coap_resource_t *resource, coap_session_t *session, const coap_pdu_t *request,
                    const coap_string_t *query, coap_pdu_t *response);

char *listen_address = "0.0.0.0";
char *listen_port = "5683";

int main(int argc, char **argv) {
    coap_startup();

    coap_context_t *context = create_coap_context(listen_address, listen_port);

    printf("coap server running at coap://%s:%s/", listen_address, listen_address);
    printf("\t/");

    register_coap_resource(context, "", COAP_REQUEST_GET, hello_resource);
    start_coap_server(context);

    coap_free_context(context);
    return 0;
}

void hello_resource(coap_resource_t *resource, coap_session_t *session, const coap_pdu_t *request,
                    const coap_string_t *query, coap_pdu_t *response) {

    const char *response_data = "Hello from IoT!";
    coap_add_data(response, strlen(response_data), (const uint8_t *)response_data);
    coap_pdu_set_code(response, COAP_RESPONSE_CODE_CONTENT);
}
