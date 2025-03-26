#include "libcoap/include/coap3/coap.h"
#include <arpa/inet.h>
#include <stdio.h>
#include <stdlib.h>

#define TOKEN_SIZE 32

typedef void (*coap_method_handler_t)(coap_resource_t *resource, coap_session_t *session,
                                      const coap_pdu_t *request, const coap_string_t *query,
                                      coap_pdu_t *response);

FILE *oscore_sequence_file = NULL;
char *oscore_sequence_file_path = "sequence";
unsigned char *token;

static int oscore_save_sequence_number(uint64_t sender_seq_num, void *param COAP_UNUSED) {

    if (oscore_sequence_file) {
        rewind(oscore_sequence_file);
        fprintf(oscore_sequence_file, "%lu\n", sender_seq_num);
        fflush(oscore_sequence_file);
    }
    return 1;
}

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

int set_up_oscore(coap_context_t *coap_context, uint8_t oscore_config[], size_t oscore_config_len) {
    if (coap_oscore_is_supported()) {
        coap_str_const_t config = {oscore_config_len, oscore_config};
        uint64_t start_seq_num = 0;
        coap_oscore_conf_t *oscore_conf;

        oscore_sequence_file = fopen(oscore_sequence_file_path, "r+");
        if (oscore_sequence_file == NULL) {
            oscore_sequence_file = fopen(oscore_sequence_file_path, "w+");
        }

        fscanf(oscore_sequence_file, "%ju", &start_seq_num);

        oscore_conf =
            coap_new_oscore_conf(config, oscore_save_sequence_number, NULL, start_seq_num);
        if (!oscore_conf) {
            coap_free_context(coap_context);
            return 0;
        }
        coap_context_oscore_server(coap_context, oscore_conf);
        return 1;
    }
    return 0;
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

void set_up_resource(coap_resource_t *resource, coap_session_t *session, const coap_pdu_t *request,
                     const coap_string_t *query, coap_pdu_t *response);

char *listen_address = "0.0.0.0";
char *listen_port = "5683";

unsigned char *generateToken() {
    const char charset[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const size_t charset_size = sizeof(charset) - 1; // -1 to exclude the null terminator
    unsigned char *random_bytes = (unsigned char *)malloc(TOKEN_SIZE * sizeof(unsigned char));
    for (int i = 0; i < TOKEN_SIZE; i++) {
        int index = rand() % charset_size;
        random_bytes[i] = charset[index];
    }
    printf("Generated Token: ");
    for (int i = 0; i < TOKEN_SIZE; i++) {
        printf("%02x", random_bytes[i]);
    }
    printf("\n");
    return random_bytes;
}

int main(int argc, char **argv) {
    token = generateToken();

    printf("coap server running at coap://%s:%s/\n", listen_address, listen_port);
    printf("\t/\n");
    printf("\t/.well-known/info\n");

    coap_startup();

    static uint8_t oscore_config[] = "master_secret,ascii,\"0000\"\n"
                                     "sender_id,ascii,\"iot\"\n"
                                     "recipient_id,ascii,\"client\"\n";

    coap_context_t *context = create_coap_context(listen_address, listen_port);
    set_up_oscore(context, oscore_config,sizeof(oscore_config));

    register_coap_resource(context, "", COAP_REQUEST_POST, hello_resource);
    register_coap_resource(context, ".well-known/info", COAP_REQUEST_GET, set_up_resource);
    start_coap_server(context);

    coap_free_context(context);
    return 0;
}

void hello_resource(coap_resource_t *resource, coap_session_t *session, const coap_pdu_t *request,
                    const coap_string_t *query, coap_pdu_t *response) {
    coap_tick_t t;
    size_t payload_size;
    const uint8_t *payload;

    // --- Authorization cheching ---
    coap_get_data(request, &payload_size, &payload);
    if (payload_size < TOKEN_SIZE) {
        const char *response_data = "There is no authorization token";
        coap_add_data(response, strlen(response_data), (const uint8_t *)response_data);
        coap_pdu_set_code(response, COAP_RESPONSE_CODE_UNAUTHORIZED);
        return;
    }
    printf("%ld %d\n",payload_size,TOKEN_SIZE);
    printf("%.*s\n", (int)payload_size, (const char *)payload);
    for (size_t i = 0; i < TOKEN_SIZE; i++) {
        if (payload[i] != token[i]) {
            const char *response_data = "wrong authorization token";
            coap_add_data(response, strlen(response_data), (const uint8_t *)response_data);
            coap_pdu_set_code(response, COAP_RESPONSE_CODE_UNAUTHORIZED);
            return;
        }
    }
    // --- Authorization cheching done ---


    const char *response_data = "Hello from IoT!";
    coap_add_data(response, strlen(response_data), (const uint8_t *)response_data);
    coap_pdu_set_code(response, COAP_RESPONSE_CODE_CONTENT);
}

void set_up_resource(coap_resource_t *resource, coap_session_t *session, const coap_pdu_t *request,
                     const coap_string_t *query, coap_pdu_t *response) {

    const unsigned char *response_data = token;
    coap_add_data(response, TOKEN_SIZE, (const uint8_t *)response_data);
    coap_pdu_set_code(response, COAP_RESPONSE_CODE_CONTENT);
}