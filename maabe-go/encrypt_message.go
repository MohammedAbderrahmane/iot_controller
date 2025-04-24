// package main

// import (
// 	"encoding/json"
// 	"fmt"
// 	"math/big"
// 	"os"

// 	"github.com/fentec-project/bn256"
// 	"github.com/fentec-project/gofe/abe"
// )

// type PublicParameters_JSON struct {
// 	P  []byte `json:"P"`
// 	G1 []byte `json:"G1"`
// 	G2 []byte `json:"G2"`
// 	Gt []byte `json:"Gt"`
// }

// type Auth_PK_JSON struct {
// 	Attribs    []string            `json:"attributes"`
// 	EggToAlpha map[string]([]byte) `json:"EggToAlpha"`
// 	GToY       map[string]([]byte) `json:"GToY"`
// }

// type Cipher_JSON struct {
// 	C0     []byte            `json:"C0"`
// 	C1x    map[string][]byte `json:"C1x"`
// 	C2x    map[string][]byte `json:"C2x"`
// 	C3x    map[string][]byte `json:"C3x"`
// 	Msp    *abe.MSP
// 	SymEnc []byte `json:"SymEnc"`
// 	Iv     []byte `json:"Iv"`
// }

// func LoadPublicParameters(jsonData []byte) *abe.MAABE {
// 	var pk PublicParameters_JSON
// 	err := json.Unmarshal([]byte(jsonData), &pk)
// 	if err != nil {
// 		panic(err)
// 	}

// 	p := new(big.Int).SetBytes(pk.P)

// 	g1 := new(bn256.G1)
// 	g1.Unmarshal(pk.G1)

// 	g2 := new(bn256.G2)
// 	g2.Unmarshal(pk.G2)

// 	gt := new(bn256.GT)
// 	gt.Unmarshal(pk.Gt)

// 	return &abe.MAABE{
// 		P:  p,
// 		G1: g1,
// 		G2: g2,
// 		Gt: gt,
// 	}
// }

// func LoadAuthPublicKey(jsonData []byte) *abe.MAABEPubKey {
// 	var pk Auth_PK_JSON
// 	err := json.Unmarshal([]byte(jsonData), &pk)
// 	if err != nil {
// 		panic(err)
// 	}

// 	EggToAlpha := make(map[string]*bn256.GT)
// 	for key, value := range pk.EggToAlpha {
// 		v := new(bn256.GT)
// 		v.Unmarshal(value)
// 		EggToAlpha[key] = v
// 	}
// 	GToY := make(map[string]*bn256.G2)
// 	for key, value := range pk.GToY {
// 		v := new(bn256.G2)
// 		v.Unmarshal(value)
// 		GToY[key] = v
// 	}
// 	return &abe.MAABEPubKey{
// 		Attribs:    pk.Attribs,
// 		EggToAlpha: EggToAlpha,
// 		GToY:       GToY,
// 	}

// }

// func LoadAllAuthPublicKey(paths []string) []*abe.MAABEPubKey {
// 	var authsPublicKeys []*abe.MAABEPubKey

// 	for _, path := range paths {
// 		fileContent, err := os.ReadFile(path)
// 		if err != nil {
// 			panic(err)
// 		}

// 		authsPublicKeys = append(authsPublicKeys, LoadAuthPublicKey(fileContent))
// 	}
// 	return authsPublicKeys
// }

// func SaveCyphertext(cyphertext *abe.MAABECipher) []byte {
// 	C1x := make(map[string]([]byte))
// 	for key, value := range cyphertext.C1x {
// 		C1x[key] = value.Marshal()
// 	}
// 	C2x := make(map[string]([]byte))
// 	for key, value := range cyphertext.C2x {
// 		C2x[key] = value.Marshal()
// 	}
// 	C3x := make(map[string]([]byte))
// 	for key, value := range cyphertext.C3x {
// 		C3x[key] = value.Marshal()
// 	}
// 	c0 := cyphertext.C0.Marshal()

// 	pk := Cipher_JSON{
// 		C0:     c0,
// 		C1x:    C1x,
// 		C2x:    C2x,
// 		C3x:    C3x,
// 		Msp:    cyphertext.Msp,
// 		SymEnc: cyphertext.SymEnc,
// 		Iv:     cyphertext.Iv,
// 	}

// 	jsonData, err := json.Marshal(pk)
// 	if err != nil {
// 		panic(err)
// 	}

// 	err = os.WriteFile("cyphertext.json", jsonData, 0644)
// 	return jsonData
// }

// func EncryptPlainText(
// 	maabe_public_parameters_path string,
// 	access_policy_str string,
// 	message string,
// 	auths_path []string) string {

// 	public_parameters, err := os.ReadFile(maabe_public_parameters_path)
// 	if err != nil {
// 		panic(err)
// 	}
// 	maabe := LoadPublicParameters(public_parameters)
// 	auths_public_keys := LoadAllAuthPublicKey(auths_path)
// 	access_policy, _ := abe.BooleanToMSP(access_policy_str, false)

// 	cyphertext, err := maabe.Encrypt(message, access_policy, auths_public_keys)
// 	if err != nil {
// 		panic(err)
// 	}
// 	return string(SaveCyphertext(cyphertext))
// }

// func main() {
// 	args := os.Args[1:]

// 	auths_paths := args[3:]
// 	cyphertext := EncryptPlainText(args[0], args[1], args[2], auths_paths)
// 	fmt.Print(cyphertext)
// }
