/*
 * coap_resource_internal.h -- generic resource handling
 *
 * Copyright (C) 2010,2011,2014-2025 Olaf Bergmann <bergmann@tzi.org>
 *
 * SPDX-License-Identifier: BSD-2-Clause
 *
 * This file is part of the CoAP library libcoap. Please see README for terms
 * of use.
 */

/**
 * @file coap_resource_internal.h
 * @brief Generic resource internal handling
 */

#ifndef COAP_RESOURCE_INTERNAL_H_
#define COAP_RESOURCE_INTERNAL_H_

#include "coap_internal.h"
#include "coap_uthash_internal.h"

#if COAP_SERVER_SUPPORT
/**
 * @ingroup internal_api
 * @defgroup coap_resource_internal Resources
 * Internal API for handling resources
 * @{
 */

/**
 * Limits the number of subscribers for each resource that this server support.
 * Zero means there is no maximum.
 */
#ifndef COAP_RESOURCE_MAX_SUBSCRIBER
#define COAP_RESOURCE_MAX_SUBSCRIBER 0
#endif /* COAP_RESOURCE_MAX_SUBSCRIBER */

/**
* Abstraction of attribute associated with a resource.
*/
struct coap_attr_t {
  struct coap_attr_t *next; /**< Pointer to next in chain or NULL */
  coap_str_const_t *name;   /**< Name of the attribute */
  coap_str_const_t *value;  /**< Value of the attribute (can be NULL) */
  int flags;
};

/**
* Abstraction of resource that can be attached to coap_context_t.
* The key is uri_path.
*/
struct coap_resource_t {
  unsigned int dirty:1;          /**< set to 1 if resource has changed */
  unsigned int partiallydirty:1; /**< set to 1 if some subscribers have not yet
                                  *   been notified of the last change */
  unsigned int observable:1;     /**< can be observed */
  unsigned int cacheable:1;      /**< can be cached */
  unsigned int is_unknown:1;     /**< resource created for unknown handler */
  unsigned int is_proxy_uri:1;   /**< resource created for proxy URI handler */
  unsigned int is_reverse_proxy:1; /**< resource created for reverse proxy URI handler */

  /**
   * Used to store handlers for the seven coap methods @c GET, @c POST, @c PUT,
   * @c DELETE, @c FETCH, @c PATCH and @c IPATCH.
   * coap_dispatch() will pass incoming requests to handle_request() and then
   * to the handler that corresponds to its request method or generate a 4.05
   * response if no handler is available.
   */
  coap_method_handler_t handler[7];

  UT_hash_handle hh;

  coap_attr_t *link_attr; /**< attributes to be included with the link format */
  coap_subscription_t *subscribers;  /**< list of observers for this resource */

  /**
   * Request URI Path for this resource. This field will point into static
   * or allocated memory which must remain there for the duration of the
   * resource.
   */
  coap_str_const_t *uri_path;  /**< the key used for hash lookup for this
                                    resource */
  int flags; /**< zero or more COAP_RESOURCE_FLAGS_* or'd together */

  /**
  * The next value for the Observe option. This field must be increased each
  * time the resource changes. Only the lower 24 bits are sent.
  */
  unsigned int observe;

  /**
   * Pointer back to the context that 'owns' this resource.
   */
  coap_context_t *context;

  /**
   * Count of valid names this host is known by (proxy support)
   */
  size_t proxy_name_count;

  /**
   * Array valid names this host is known by (proxy support)
   */
  coap_str_const_t **proxy_name_list;

  /**
   * This pointer is under user control. It can be used to store context for
   * the coap handler.
   */
  void *user_data;

};

/**
 * Registers the given @p resource for @p context. The resource must have been
 * created by coap_resource_init() or coap_resource_unknown_init(), the
 * storage allocated for the resource will be released by coap_delete_resource_lkd().
 *
 * Note: This function must be called in the locked state.
 *
 * @param context  The context to use.
 * @param resource The resource to store.
 */
void coap_add_resource_lkd(coap_context_t *context, coap_resource_t *resource);

/**
 * Deletes a resource identified by @p resource. The storage allocated for that
 * resource is freed, and removed from the context.
 *
 * Note: This function must be called in the locked state.
 *
 * @param context  This parameter is ignored, but kept for backward
 *                 compatibility.
 * @param resource The resource to delete.
 *
 * @return         @c 1 if the resource was found (and destroyed),
 *                 @c 0 otherwise.
 */
int coap_delete_resource_lkd(coap_context_t *context, coap_resource_t *resource);

/**
 * Deletes all resources from given @p context and frees their storage.
 *
 * @param context The CoAP context with the resources to be deleted.
 */
void coap_delete_all_resources(coap_context_t *context);

#define RESOURCES_ADD(r, obj) \
  HASH_ADD(hh, (r), uri_path->s[0], (obj)->uri_path->length, (obj))

#define RESOURCES_DELETE(r, obj) \
  HASH_DELETE(hh, (r), (obj))

#define RESOURCES_ITER(r,tmp)  \
  coap_resource_t *tmp, *rtmp; \
  HASH_ITER(hh, (r), tmp, rtmp)

#define RESOURCES_FIND(r, k, res) {                     \
    HASH_FIND(hh, (r), (k)->s, (k)->length, (res)); \
  }

/**
 * Returns the resource identified by the unique string @p uri_path. If no
 * resource was found, this function returns @c NULL.
 *
 * Note: This function must be called in the locked state.
 *
 * @param context  The context to look for this resource.
 * @param uri_path  The unique string uri of the resource.
 *
 * @return         A pointer to the resource or @c NULL if not found.
 */
coap_resource_t *coap_get_resource_from_uri_path_lkd(coap_context_t *context,
                                                     coap_str_const_t *uri_path);

/**
 * Deletes an attribute.
 * Note: This is for internal use only, as it is not deleted from its chain.
 *
 * @param attr Pointer to a previously created attribute.
 *
 */
void coap_delete_attr(coap_attr_t *attr);

/**
 * Prints the names of all known resources for @p context to @p buf. This function
 * sets @p buflen to the number of bytes actually written and returns
 * @c COAP_PRINT_STATUS_ERROR on error. On error, the value in @p buflen is undefined.
 * Otherwise, the lower 28 bits are set to the number of bytes that have actually
 * been written. COAP_PRINT_STATUS_TRUNC is set when the output has been truncated.
 *
 * Note: This function must be called in the locked state.
 *
 * @param context The context with the resource map.
 * @param buf     The buffer to write the result.
 * @param buflen  Must be initialized to the maximum length of @p buf and will be
 *                set to the length of the well-known response on return.
 * @param offset  The offset in bytes where the output shall start and is
 *                shifted accordingly with the characters that have been
 *                processed. This parameter is used to support the block
 *                option.
 * @param query_filter A filter query according to <a href="http://tools.ietf.org/html/draft-ietf-core-link-format-11#section-4.1">Link Format</a>
 *
 * @return COAP_PRINT_STATUS_ERROR on error. Otherwise, the lower 28 bits are
 *         set to the number of bytes that have actually been written to
 *         @p buf. COAP_PRINT_STATUS_TRUNC is set when the output has been
 *         truncated.
 */
coap_print_status_t coap_print_wellknown_lkd(coap_context_t *context,
                                             unsigned char *buf,
                                             size_t *buflen,
                                             size_t offset,
                                             const coap_string_t *query_filter);

/** @} */

#endif /* COAP_SERVER_SUPPORT */

#endif /* COAP_RESOURCE_INTERNAL_H_ */
