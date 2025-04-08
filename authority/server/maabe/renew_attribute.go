// package main

// import (
// 	"encoding/json"
// 	"fmt"
// 	"math/big"
// 	"os"

// 	"github.com/fentec-project/bn256"
// 	"github.com/fentec-project/gofe/abe"
// )

// const MAABE_PUBLIC_PARAMETERS_PATH string = "../keys/maabe_public_parameters.json"
// const AUTHORITY_PATH string = "../keys/authority.json"

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

// type Auth_SK_JSON struct {
// 	Attribs []string            `json:"attributes"`
// 	Alpha   map[string]([]byte) `json:"Alpha"`
// 	Y       map[string]([]byte) `json:"Y"`
// }

// type Authority_JSON struct {
// 	ID string        `json:"ID"`
// 	Pk *Auth_PK_JSON `json:"Pk"`
// 	Sk *Auth_SK_JSON `json:"Sk"`
// }

// type UserKey_JSON struct {
// 	Gid    string `json:"Gid"`
// 	Attrib string `json:"Attrib"`
// 	Key    []byte `json:"Key"`
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

// func LoadAuth(jsonData []byte, maabe *abe.MAABE) *abe.MAABEAuth {
// 	var auth Authority_JSON
// 	err := json.Unmarshal([]byte(jsonData), &auth)
// 	if err != nil {
// 		panic(err)
// 	}

// 	EggToAlpha := make(map[string]*bn256.GT)
// 	for key, value := range auth.Pk.EggToAlpha {
// 		v := new(bn256.GT)
// 		v.Unmarshal(value)
// 		EggToAlpha[key] = v
// 	}
// 	GToY := make(map[string]*bn256.G2)
// 	for key, value := range auth.Pk.GToY {
// 		v := new(bn256.G2)
// 		v.Unmarshal(value)
// 		GToY[key] = v
// 	}
// 	Alpha := make(map[string]*big.Int)
// 	for key, value := range auth.Sk.Alpha {
// 		v := new(big.Int)
// 		v.UnmarshalText(value)
// 		Alpha[key] = v
// 	}
// 	Y := make(map[string]*big.Int)
// 	for key, value := range auth.Sk.Y {
// 		v := new(big.Int)
// 		v.UnmarshalText(value)
// 		Y[key] = v
// 	}

// 	pk := &abe.MAABEPubKey{
// 		Attribs:    auth.Pk.Attribs,
// 		EggToAlpha: EggToAlpha,
// 		GToY:       GToY,
// 	}
// 	sk := &abe.MAABESecKey{
// 		Attribs: auth.Sk.Attribs,
// 		Alpha:   Alpha,
// 		Y:       Y,
// 	}

// 	return &abe.MAABEAuth{
// 		ID:    auth.ID,
// 		Maabe: maabe,
// 		Pk:    pk,
// 		Sk:    sk,
// 	}
// }

// func SaveAuth(auth *abe.MAABEAuth) string {
// 	eggtoalpha := make(map[string]([]byte))
// 	for key, value := range auth.Pk.EggToAlpha {
// 		eggtoalpha[key] = value.Marshal()
// 	}
// 	gtoy := make(map[string]([]byte))
// 	for key, value := range auth.Pk.GToY {
// 		gtoy[key] = value.Marshal()
// 	}
// 	alpha := make(map[string]([]byte))
// 	for key, value := range auth.Sk.Alpha {
// 		v, _ := value.MarshalText()
// 		alpha[key] = v
// 	}
// 	y := make(map[string]([]byte))
// 	for key, value := range auth.Sk.Y {
// 		v, _ := value.MarshalText()
// 		y[key] = v
// 	}

// 	authPK := Auth_PK_JSON{
// 		Attribs:    auth.Pk.Attribs,
// 		EggToAlpha: eggtoalpha,
// 		GToY:       gtoy,
// 	}

// 	authSK := Auth_SK_JSON{
// 		Attribs: auth.Sk.Attribs,
// 		Alpha:   alpha,
// 		Y:       y,
// 	}

// 	auth_JSON := Authority_JSON{
// 		ID: auth.ID,
// 		Pk: &authPK,
// 		Sk: &authSK,
// 	}

// 	jsonData, err := json.Marshal(auth_JSON)
// 	if err != nil {
// 		panic(err)
// 	}

// 	err = os.WriteFile(AUTHORITY_PATH, jsonData, 0644)
// 	if err != nil {
// 		panic(err)
// 	}

// 	return string(jsonData)
// }

// func main() {
// 	args := os.Args[1:]

// 	maabeJson, _ := os.ReadFile(MAABE_PUBLIC_PARAMETERS_PATH)
// 	maabe_public_parameters := LoadPublicParameters(maabeJson)

// 	authJson, _ := os.ReadFile(AUTHORITY_PATH)
// 	authority := LoadAuth(authJson, maabe_public_parameters)

// 	err := authority.RegenerateKey(args[0])
// 	if err != nil {
// 		panic(err)
// 	}
// 	SaveAuth(authority)

// 	fmt.Print("ok")
// }
