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

type Auth_PK_JSON struct {
	Attribs    []string            `json:"attributes"`
	EggToAlpha map[string]([]byte) `json:"EggToAlpha"`
	GToY       map[string]([]byte) `json:"GToY"`
}

type Auth_SK_JSON struct {
	Attribs []string            `json:"attributes"`
	Alpha   map[string]([]byte) `json:"Alpha"`
	Y       map[string]([]byte) `json:"Y"`
}

type Authority_JSON struct {
	ID string        `json:"ID"`
	Pk *Auth_PK_JSON `json:"Pk"`
	Sk *Auth_SK_JSON `json:"Sk"`
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

func LoadPublicParameters(jsonData []byte) *abe.MAABE {
	var pk PublicParameters_JSON
	err := json.Unmarshal([]byte(jsonData), &pk)
	if err != nil {
		panic(err)
	}

	p := new(big.Int).SetBytes(pk.P)

	g1 := new(bn256.G1)
	g1.Unmarshal(pk.G1)

	g2 := new(bn256.G2)
	g2.Unmarshal(pk.G2)

	gt := new(bn256.GT)
	gt.Unmarshal(pk.Gt)

	return &abe.MAABE{
		P:  p,
		G1: g1,
		G2: g2,
		Gt: gt,
	}
}

func LoadAuth(jsonData []byte, maabe *abe.MAABE) *abe.MAABEAuth {
	var auth Authority_JSON
	err := json.Unmarshal([]byte(jsonData), &auth)
	if err != nil {
		panic(err)
	}

	EggToAlpha := make(map[string]*bn256.GT)
	for key, value := range auth.Pk.EggToAlpha {
		v := new(bn256.GT)
		v.Unmarshal(value)
		EggToAlpha[key] = v
	}
	GToY := make(map[string]*bn256.G2)
	for key, value := range auth.Pk.GToY {
		v := new(bn256.G2)
		v.Unmarshal(value)
		GToY[key] = v
	}
	Alpha := make(map[string]*big.Int)
	for key, value := range auth.Sk.Alpha {
		v := new(big.Int)
		v.UnmarshalText(value)
		Alpha[key] = v
	}
	Y := make(map[string]*big.Int)
	for key, value := range auth.Sk.Y {
		v := new(big.Int)
		v.UnmarshalText(value)
		Y[key] = v
	}

	pk := &abe.MAABEPubKey{
		Attribs:    auth.Pk.Attribs,
		EggToAlpha: EggToAlpha,
		GToY:       GToY,
	}
	sk := &abe.MAABESecKey{
		Attribs: auth.Sk.Attribs,
		Alpha:   Alpha,
		Y:       Y,
	}

	return &abe.MAABEAuth{
		ID:    auth.ID,
		Maabe: maabe,
		Pk:    pk,
		Sk:    sk,
	}
}

func SaveUserKeys(keyList []*abe.MAABEKey) string {
	var keys []UserKey_JSON

	for _, key := range keyList {
		v := key.Key.Marshal()
		keys = append(keys, UserKey_JSON{
			Gid:    key.Gid,
			Attrib: key.Attrib,
			Key:    v,
		})
	}

	jsonData, err := json.Marshal(keys)
	if err != nil {
		panic(err)
	}

	return string(jsonData)
}

func main() {
	args := os.Args[1:]

	maabeJson, _ := os.ReadFile(args[0])
	maabe_public_parameters := LoadPublicParameters(maabeJson)

	authJson, _ := os.ReadFile(args[1])
	authority := LoadAuth(authJson, maabe_public_parameters)

	attributes := args[3:]
	keys, err := authority.GenerateAttribKeys(args[2], attributes)
	if err != nil {
		panic(err)
	}

	fmt.Print(SaveUserKeys(keys))
}
