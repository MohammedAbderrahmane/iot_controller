# generate a new maabe public parameter

This script generates and saves new random public parameters for MA-ABE into JSON then saved it to a file

@parameter : the output file

@output : json file

```bash
go run create_public_parameters.go output.json
```

# generate a new maabe authority

This script generates and saves new authority into JSON then saved it to a file

@parameter :

- the output file
- maabe public parameters path
- name of authority
- attributes...

@output : json file

```bash
go run create_authority.go output.json maabePP.json univ-tlemcen a1 a2 a3 a4
```

# get authority public keys

This script gets an authority public keys and saves them into JSON then saved it to a file

@parameter :

- the output file
- maabe public parameters path
- authority path

@output : json file

```bash
go run create_authority.go output.json maabePP.json univ-tlemcen A:a1 A:a2 A:a3 A:a4
```

# encrypt a message

This script encrypt a message and return it's cyphertext

@parameter :

- maabe public parameters path
- access policy
- message
- all the included authorities paths...

@output : json string (must be handled by the executer)

```bash
go run encrypt_message.go maabePP.json "(A:a1 AND B:b2)" "message to be encrypted" path/auth1 path/auth2 path/auth3 path/auth4
```

# create a user keys from an authority

This script generate users keys from an authority and them in json

@parameter :

- maabe public parameters path
- authority oath
- GID of user
- attributes...

@output : json string (must be handled by the executer)

```bash
go run create_user_keys.go maabePP.json auth1.json islem a1 a2 a3
```

# decrypt a cyphertext

This script decrypt cyphertext and return plaintext

@parameter :

- maabe public parameters path
- cyphertext
- user keys (json)

@output : plaintext

```bash
go run create_user_keys.go maabePP.json auth1.json islem a1 a2 a3
```