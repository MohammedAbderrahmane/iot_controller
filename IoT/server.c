#include "libcoap/include/coap3/coap.h"
#include <arpa/inet.h>
#include <stdio.h>
#include <stdlib.h>

#define TOKEN_SIZE 32
const char *ID = "object_1";
const char *IP_ADDRESS = "192.168.200";
const char *PORT = "5683";
const char *ACCESS_POLICY = "( tlemcen:prof OR tlemcen:etudiant )";
const char *SENDER_ID = "client";
const char *RECIPIENT_ID = "iot";
const char *SECRET = "0000";

const char *FOG_NODE_OBJECT_REGISTRY = "coap://192.168.1.12/register";
const char *LISTEN_ADDRESS = "0.0.0.0";
const char *LISTEN_PORT = "5684";

typedef void (*coap_method_handler_t)(coap_resource_t *resource, coap_session_t *session,
                                      const coap_pdu_t *request, const coap_string_t *query,
                                      coap_pdu_t *response);

FILE *oscore_sequence_file = NULL;
char *oscore_sequence_file_path = "sequence";
unsigned char *token;

static int have_response = 0;

char *get_iot_info() {
    size_t buffer_size =
        snprintf(NULL, 0,
                 "{\"%s\":{\"ip_address\":\"%s\",\"port\":\"%s\",\"oscore_context\":{\"sender-id_ascii\":\"%s\",\"recipient-id_ascii\":\"%s\",\"secret_ascii\":\"%s\"},\"access_policy\":\"%s\"}}",
                 ID, IP_ADDRESS, PORT, SENDER_ID, RECIPIENT_ID, SECRET, ACCESS_POLICY) +
        1;
    char *json_string = malloc(buffer_size);
    if (!json_string) {
        perror("Memory allocation failed");
        exit(1);
    }
    snprintf(json_string, buffer_size,
             "{\"%s\":{\"ip_address\":\"%s\",\"port\":\"%s\",\"oscore_context\":{\"sender-id_ascii\":\"%s\",\"recipient-id_ascii\":\"%s\",\"secret_ascii\":\"%s\"},\"access_policy\":\"%s\"}}",
             ID, IP_ADDRESS, PORT, SENDER_ID, RECIPIENT_ID, SECRET, ACCESS_POLICY);

    return json_string;
}

int resolve_address(coap_str_const_t *host, uint16_t port, coap_address_t *server_addr,
                    int scheme_hint_bits) {
    coap_addr_info_t *addr_info;
    addr_info = coap_resolve_address_info(host, port, port, port, port, AF_UNSPEC, scheme_hint_bits,
                                          COAP_RESOLVE_TYPE_REMOTE);
    if (addr_info) {
        *server_addr = addr_info->addr;
    }
    coap_free_address_info(addr_info);
}

coap_response_t fog_registry_response_handler(coap_session_t *session, const coap_pdu_t *sent,
                                 const coap_pdu_t *received, const coap_mid_t mid) {
    coap_tick_t t;
    size_t payload_size;
    const uint8_t *payload;

    coap_pdu_code_t code = coap_pdu_get_code(received);
    if (code != COAP_RESPONSE_CODE_CONTENT){
        printf("failed to contact fog node");
        exit(1);

    }

    coap_get_data(received, &payload_size, &payload);
    token = malloc(payload_size);
    snprintf(token, payload_size, "%s", payload);
    printf("Token = %s\n", token);
    have_response = 1;
    return COAP_RESPONSE_OK;
}

int contact_fog_node(const unsigned char *server_uri, unsigned char *iot_info) {
    coap_context_t *client_coap_context = NULL;
    coap_session_t *session = NULL;
    coap_optlist_t *optlist = NULL;
    coap_pdu_t *pdu = NULL;

    coap_address_t server_addr;
    coap_uri_t uri;

    coap_startup();

    coap_split_uri(server_uri, strlen(server_uri), &uri);
    resolve_address(&uri.host, uri.port, &server_addr, 1 << uri.scheme);

    client_coap_context = coap_new_context(NULL);

    /* Support large responses */
    coap_context_set_block_mode(client_coap_context,
                                COAP_BLOCK_USE_LIBCOAP | COAP_BLOCK_SINGLE_BODY);
    session = coap_new_client_session(client_coap_context, NULL, &server_addr, COAP_PROTO_UDP);

    coap_register_response_handler(client_coap_context, fog_registry_response_handler);
    pdu = coap_pdu_init(COAP_MESSAGE_CON, COAP_REQUEST_CODE_POST, coap_new_message_id(session),
                        coap_session_max_pdu_size(session));

    coap_add_option(pdu, COAP_OPTION_URI_PATH, uri.path.length, uri.path.s);
    coap_add_data(pdu, strlen(iot_info), iot_info);
    coap_show_pdu(COAP_LOG_WARN, pdu);
    printf("\n");
    if (coap_send(session, pdu) == COAP_INVALID_MID) {
        coap_log_err("cannot send CoAP pdu\n");
        return 0;
    }

    int res;
    unsigned int wait_ms;
    wait_ms = (coap_session_get_default_leisure(session).integer_part + 1) * 1000;
    while (have_response == 0) {
        res = coap_io_process(client_coap_context, 1000);
        if (res >= 0) {
            if (wait_ms > 0) {
                if ((unsigned)res >= wait_ms) {
                    fprintf(stdout, "timeout : Failed to contact the fog node\n");
                    exit(1);
                    break;
                } else {
                    wait_ms -= res;
                }
            }
        }
    }

    coap_delete_optlist(optlist);
    coap_session_release(session);
    coap_free_context(client_coap_context);
    coap_cleanup();

    return 1;
}

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

int main(int argc, char **argv) {
    // char *iot_info();
    // unsigned char *object_info = json_start_object();
    // json_add_attribute(iot_sub_info, OBJECT_NAME, iot_sub_info, JSON_TYPE_INT);
    // json_end_object(object_info);

    contact_fog_node(FOG_NODE_OBJECT_REGISTRY, get_iot_info());

    printf("coap server running at coap://%s:%s/\n", LISTEN_ADDRESS, LISTEN_PORT);
    printf("\t/\n");

    coap_startup();

    static uint8_t oscore_config[] = "master_secret,ascii,\"0000\"\n"
                                     "sender_id,ascii,\"iot\"\n"
                                     "recipient_id,ascii,\"client\"\n";

    coap_context_t *context = create_coap_context(LISTEN_ADDRESS, LISTEN_PORT);
    set_up_oscore(context, oscore_config, sizeof(oscore_config));

    register_coap_resource(context, "", COAP_REQUEST_POST, hello_resource);
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
    printf("token : %s\n", token);
    printf("autherization : %s\n", (char *)payload);

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