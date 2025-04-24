package main

import (
	"encoding/json"
	"fmt"
	"math/big"
	"os"

	"github.com/fentec-project/bn256"
	"github.com/fentec-project/gofe/abe"
)

type PublicParameters_JSON struct {
	P  []byte `json:"P"`
	G1 []byte `json:"G1"`
	G2 []byte `json:"G2"`
	Gt []byte `json:"Gt"`
}

type UserKey_JSON struct {
	Gid    string `json:"Gid"`
	Attrib string `json:"Attrib"`
	Key    []byte `json:"Key"`
}

type Cipher_JSON struct {
	C0     []byte            `json:"C0"`
	C1x    map[string][]byte `json:"C1x"`
	C2x    map[string][]byte `json:"C2x"`
	C3x    map[string][]byte `json:"C3x"`
	Msp    *abe.MSP
	SymEnc []byte `json:"SymEnc"`
	Iv     []byte `json:"Iv"`
}

func DecryptCypherText(public_parameters_path string, cyphertextJson string, userKeysJson []byte) string {
	// userKeys
	if len(userKeysJson) > 0 && userKeysJson[0] != '[' {
		panic("JSON data is not an array")
	}
	var userKeysJsonList []UserKey_JSON
	err := json.Unmarshal(userKeysJson, &userKeysJsonList)
	if err != nil {
		panic(err)
	}
	var userKeys []*abe.MAABEKey
	for _, key_JSON := range userKeysJsonList {
		k := new(bn256.G1)
		k.Unmarshal(key_JSON.Key)

		v := abe.MAABEKey{
			Gid:    key_JSON.Gid,
			Attrib: key_JSON.Attrib,
			Key:    k,
		}
		userKeys = append(userKeys, &v)
	}
	// maabe
	maabeJson, _ := os.ReadFile(public_parameters_path)
	var PP PublicParameters_JSON
	json.Unmarshal([]byte(maabeJson), &PP)
	p := new(big.Int).SetBytes(PP.P)
	g1 := new(bn256.G1)
	g1.Unmarshal(PP.G1)
	g2 := new(bn256.G2)
	g2.Unmarshal(PP.G2)
	gt := new(bn256.GT)
	gt.Unmarshal(PP.Gt)

	maabe := &abe.MAABE{
		P:  p,
		G1: g1,
		G2: g2,
		Gt: gt,
	}
	// cyphertext
	var c Cipher_JSON
	json.Unmarshal([]byte(cyphertextJson), &c)
	C0 := new(bn256.GT)
	C0.Unmarshal(c.C0)
	C1x := make(map[string]*bn256.GT)
	for key, value := range c.C1x {
		v := new(bn256.GT)
		v.Unmarshal(value)
		C1x[key] = v
	}
	C2x := make(map[string]*bn256.G2)
	for key, value := range c.C2x {
		v := new(bn256.G2)
		v.Unmarshal(value)
		C2x[key] = v
	}
	C3x := make(map[string]*bn256.G2)
	for key, value := range c.C3x {
		v := new(bn256.G2)
		v.Unmarshal(value)
		C3x[key] = v
	}

	cyphertext := &abe.MAABECipher{
		C0:     C0,
		C1x:    C1x,
		C2x:    C2x,
		C3x:    C3x,
		Msp:    c.Msp,
		SymEnc: c.SymEnc,
		Iv:     c.Iv,
	}

	plaintext, _ := maabe.Decrypt(cyphertext, userKeys)
	return plaintext
}

func main() {
	args := os.Args[1:]

	plaintext := DecryptCypherText(args[0], args[1], []byte(args[2]))
	fmt.Print(plaintext)
}
