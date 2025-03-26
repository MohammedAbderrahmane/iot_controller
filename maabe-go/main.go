package main

import (
	"encoding/json"
	"fmt"
	"math/big"
	"os"
	"path/filepath"
	"strings"

	"github.com/fentec-project/bn256"
	"github.com/fentec-project/gofe/abe"
)

type Maabe struct{}

func SavePublicParameters(maabe *abe.MAABE, path string) []byte {

	pk := PublicParameters_JSON{
		P:  maabe.P.Bytes(),
		G1: maabe.G1.Marshal(),
		G2: maabe.G2.Marshal(),
		Gt: maabe.Gt.Marshal(),
	}

	jsonData, err := json.Marshal(pk)
	if err != nil {
		panic(err)
	}

	err = os.WriteFile(path, jsonData, 0644)
	if err != nil {
		panic(err)
	}
	return jsonData
}

//export LoadPublicParameters
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

//export saveAuth
func (a *Maabe) SaveAuth(auth *abe.MAABEAuth) {
	eggtoalpha := make(map[string]([]byte))
	for key, value := range auth.Pk.EggToAlpha {
		eggtoalpha[key] = value.Marshal()
	}
	gtoy := make(map[string]([]byte))
	for key, value := range auth.Pk.GToY {
		gtoy[key] = value.Marshal()
	}
	alpha := make(map[string]([]byte))
	for key, value := range auth.Sk.Alpha {
		v, _ := value.MarshalText()
		alpha[key] = v
	}
	y := make(map[string]([]byte))
	for key, value := range auth.Sk.Y {
		v, _ := value.MarshalText()
		y[key] = v
	}

	authPK := Auth_PK_JSON{
		Attribs:    auth.Pk.Attribs,
		EggToAlpha: eggtoalpha,
		GToY:       gtoy,
	}

	authSK := Auth_SK_JSON{
		Attribs: auth.Sk.Attribs,
		Alpha:   alpha,
		Y:       y,
	}

	auth_JSON := Authority_JSON{
		ID: auth.ID,
		Pk: &authPK,
		Sk: &authSK,
	}

	jsonData, err := json.Marshal(auth_JSON)
	if err != nil {
		panic(err)
	}

	err = os.WriteFile("auth_tlemcen.json", jsonData, 0644)
	if err != nil {
		panic(err)
	}

}

//export LoadAuth
func (a *Maabe) LoadAuth(jsonData []byte, maabe *abe.MAABE) *abe.MAABEAuth {
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

//export SaveAuthPublicKey
func SaveAuthPublicKey(Pk *abe.MAABEPubKey, path string) []byte {
	eggtoalpha := make(map[string]([]byte))
	for key, value := range Pk.EggToAlpha {
		eggtoalpha[key] = value.Marshal()
	}
	gtoy := make(map[string]([]byte))
	for key, value := range Pk.GToY {
		gtoy[key] = value.Marshal()
	}

	pk := Auth_PK_JSON{
		Attribs:    Pk.Attribs,
		EggToAlpha: eggtoalpha,
		GToY:       gtoy,
	}

	jsonData, err := json.Marshal(pk)
	if err != nil {
		panic(err)
	}

	err = os.WriteFile(
		fmt.Sprintf("auth_%s_keys.json", path), jsonData, 0644)
	if err != nil {
		panic(err)
	}
	return jsonData
}

//export LoadAuthPublicKey
func LoadAuthPublicKey(jsonData []byte) *abe.MAABEPubKey {
	var pk Auth_PK_JSON
	err := json.Unmarshal([]byte(jsonData), &pk)
	if err != nil {
		panic(err)
	}

	EggToAlpha := make(map[string]*bn256.GT)
	for key, value := range pk.EggToAlpha {
		v := new(bn256.GT)
		v.Unmarshal(value)
		EggToAlpha[key] = v
	}
	GToY := make(map[string]*bn256.G2)
	for key, value := range pk.GToY {
		v := new(bn256.G2)
		v.Unmarshal(value)
		GToY[key] = v
	}
	return &abe.MAABEPubKey{
		Attribs:    pk.Attribs,
		EggToAlpha: EggToAlpha,
		GToY:       GToY,
	}

}

func LoadAllAuthPublicKey(directory string) []*abe.MAABEPubKey {
	var authsPublicKeys []*abe.MAABEPubKey

	authPK_files, err := os.ReadDir(directory)
	if err != nil {
		fmt.Println("Error reading directory:", err)
		return nil
	}

	for _, file := range authPK_files {
		if !file.IsDir() && strings.HasPrefix(file.Name(), "auth_") {
			fileContent, err := os.ReadFile(filepath.Join(directory, file.Name()))
			if err != nil {
				panic(err)
			}

			authsPublicKeys = append(authsPublicKeys, LoadAuthPublicKey(fileContent))

		}
	}
	return authsPublicKeys
}

//export SaveUserKeys
func SaveUserKeys(keyList []*abe.MAABEKey) []byte {
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

	err = os.WriteFile(
		fmt.Sprintf("%s_keys.json", keyList[0].Gid), jsonData, 0644)
	if err != nil {
		panic(err)
	}
	return jsonData
}

//export LoadUserKeys
func (a *Maabe) LoadUserKeys(jsonData []byte) []*abe.MAABEKey {

	if len(jsonData) > 0 && jsonData[0] != '[' {
		panic("JSON data is not an array")
	}

	var userKeys []UserKey_JSON
	err := json.Unmarshal(jsonData, &userKeys)
	// err := json.Unmarshal(jsonData, &keys_JSON)
	if err != nil {
		panic(err)
	}

	var keys []*abe.MAABEKey
	for _, key_JSON := range userKeys {
		k := new(bn256.G1)
		k.Unmarshal(key_JSON.Key)

		v := abe.MAABEKey{
			Gid:    key_JSON.Gid,
			Attrib: key_JSON.Attrib,
			Key:    k,
		}

		keys = append(keys, &v)
	}

	return keys

}

//export SaveCyphertext
// func (a *Maabe) SaveCyphertext(cyphertext *abe.MAABECipher) {
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

// }

func SaveCyphertext(cyphertext *abe.MAABECipher) []byte {
	C1x := make(map[string]([]byte))
	for key, value := range cyphertext.C1x {
		C1x[key] = value.Marshal()
	}
	C2x := make(map[string]([]byte))
	for key, value := range cyphertext.C2x {
		C2x[key] = value.Marshal()
	}
	C3x := make(map[string]([]byte))
	for key, value := range cyphertext.C3x {
		C3x[key] = value.Marshal()
	}
	c0 := cyphertext.C0.Marshal()

	pk := Cipher_JSON{
		C0:     c0,
		C1x:    C1x,
		C2x:    C2x,
		C3x:    C3x,
		Msp:    cyphertext.Msp,
		SymEnc: cyphertext.SymEnc,
		Iv:     cyphertext.Iv,
	}

	jsonData, err := json.Marshal(pk)
	if err != nil {
		panic(err)
	}

	err = os.WriteFile("cyphertext.json", jsonData, 0644)
	return jsonData
}

//export LoadCyphertext
func LoadCyphertext(jsonData []byte) *abe.MAABECipher {
	var cyphertext Cipher_JSON
	err := json.Unmarshal([]byte(jsonData), &cyphertext)
	if err != nil {
		panic(err)
	}
	C0 := new(bn256.GT)
	C0.Unmarshal(cyphertext.C0)

	C1x := make(map[string]*bn256.GT)
	for key, value := range cyphertext.C1x {
		v := new(bn256.GT)
		v.Unmarshal(value)
		C1x[key] = v
	}
	C2x := make(map[string]*bn256.G2)
	for key, value := range cyphertext.C2x {
		v := new(bn256.G2)
		v.Unmarshal(value)
		C2x[key] = v
	}

	C3x := make(map[string]*bn256.G2)
	for key, value := range cyphertext.C3x {
		v := new(bn256.G2)
		v.Unmarshal(value)
		C3x[key] = v
	}

	return &abe.MAABECipher{
		C0:     C0,
		C1x:    C1x,
		C2x:    C2x,
		C3x:    C3x,
		Msp:    cyphertext.Msp,
		SymEnc: cyphertext.SymEnc,
		Iv:     cyphertext.Iv,
	}
}

//export DecryptCypherText
func DecryptCypherText(maabeJson []byte, cyphertextJson string, userKeysJson []byte) string {
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

//export EncryptPlainText
func EncryptPlainText(message string, access_policy_str string, maabePKPath string, authsPKPath string) string {
	maabeJson, err := os.ReadFile(maabePKPath)
	if err != nil {
		panic(err)
	}
	maabe := LoadPublicParameters(maabeJson)
	authsPublicKeys := LoadAllAuthPublicKey(authsPKPath)
	access_policy, _ := abe.BooleanToMSP(access_policy_str, false)

	cyphertext, _ := maabe.Encrypt(message, access_policy, authsPublicKeys)
	return string(SaveCyphertext(cyphertext))
}

func main() {

	// maabePK := abe.NewMAABE()

	// maabePKJson := SavePublicParameters(maabePK, "maabe-publicKey.json")

	// maabePK_v2 := LoadPublicParameters(maabePKJson)

	// attributes_tlemcen := []string{"tlemcen:etudiant", "tlemcen:prof", "tlemcen:encadrant"}
	// attributes_oran := []string{"oran:etudiant", "oran:prof", "oran:assistant"}
	// attributes_alger := []string{"alger:prof"}

	// auth_tlemcen, _ := maabePK_v2.NewMAABEAuth("tlemcen", attributes_tlemcen)
	// auth_oran, _ := maabePK_v2.NewMAABEAuth("oran", attributes_oran)
	// auth_alger, _ := maabePK_v2.NewMAABEAuth("alger", attributes_alger)

	// // authorities_public_key := []*abe.MAABEPubKey{auth_tlemcen.PubKeys(), auth_oran.PubKeys(), auth_alger.PubKeys()}

	// SaveAuthPublicKey(auth_tlemcen.PubKeys(), "tlemcen")
	// SaveAuthPublicKey(auth_oran.PubKeys(), "oran")
	// SaveAuthPublicKey(auth_alger.PubKeys(), "alger")

	// // authorities_public_key_v2 := LoadAllAuthPublicKey(".")

	// user_gid := "mohammed"
	// user_attributes_tlemcen := []string{"tlemcen:etudiant", "tlemcen:prof"}
	// user_attributes_oran := []string{"oran:assistant"}
	// keys1, _ := auth_tlemcen.GenerateAttribKeys(user_gid, user_attributes_tlemcen)
	// keys2, _ := auth_oran.GenerateAttribKeys(user_gid, user_attributes_oran)

	// user_keys := []*abe.MAABEKey{keys1[0], keys1[1], keys2[0]}
	// user_keysJson := SaveUserKeys(user_keys)

	// msg := "hello!"
	// access_policy, _ := abe.BooleanToMSP("( (tlemcen:encadrant AND oran:prof) OR (tlemcen:etudiant AND oran:assistant) OR alger:prof)", false)

	// cyphertext, _ := maabePK.Encrypt(msg, access_policy, authorities_public_key_v2)

	cyphertextJson := EncryptPlainText(
		"!hello!",
		"( (tlemcen:encadrant AND oran:prof) OR (tlemcen:etudiant AND oran:assistant) OR alger:prof)",
		"maabe-publicKey.json",
		".")
	println(cyphertextJson)
	// cyphertext_v2 := LoadCyphertext([]byte(cyphertextJson))

	// plaintext, _ := maabePK.Decrypt(cyphertext_v2, user_keys)
	// println(plaintext)

	// plaintext_v2 := DecryptCypherText(maabePKJson, cyphertextJson, user_keysJson)
	// println(plaintext_v2)

	// maabe := abe.NewMAABE()
	// NewMAABE().SavePublicParameters(maabe, "maabe-publicKey.json")

	// attributes_tlemcen := []string{"tlemcen:etudiant", "tlemcen:prof", "tlemcen:encadrant"}
	// auth_tlemcen, _ := maabe.NewMAABEAuth("tlemcen", attributes_tlemcen)

	// NewMAABE().SaveAuthPublicKey(auth_tlemcen.Pk, "auth_tlemcen_public_key.json")

	// cyphertext := EncryptPlainText("mohammed", "( (tlemcen:prof ) OR (tlemcen:etudiant) )")

	// maabeJson, err := os.ReadFile("maabe-publicKey.json")
	// if err != nil {
	// 	panic(err)
	// }
	// // cypherJson, err := os.ReadFile("cyphertext.json")
	// // if err != nil {
	// // 	panic(err)
	// // }
	// keysJson, err := os.ReadFile("mohammed_keys.json")
	// if err != nil {
	// 	panic(err)
	// }

	// plaintext := NewMAABE().DecryptCypherText(maabeJson, cyphertext, keysJson)

	// println(plaintext)

	// tool:= abe.NewMAABE()

	// // NewMAABE().SavePublicParameters(maabe,"maabe-publicKey.json")

	// 	JSONdata, err := os.ReadFile("maabe-publicKey.json")
	// 	if err != nil {
	// 		panic(err)
	// 	}
	// 	maabe := tool.LoadPublicParameters(JSONdata)

	// 	attributes_tlemcen := []string{"tlemcen:etudiant", "tlemcen:prof", "tlemcen:encadrant"}
	// 	auth_tlemcen, _ := maabe.NewMAABEAuth("tlemcen", attributes_tlemcen)

	// 	// saveAuth(auth_tlemcen)
	// tool.SaveAuthPublicKey(auth_tlemcen.Pk)

	// 	JSONdata, err = os.ReadFile("auth_tlemcen.json")
	// 	if err != nil {
	// 		panic(err)
	// 	}
	// 	loadedAuth_tlemcen := loadAuth(JSONdata, maabe)

	// for key, value := range loadedAuth_tlemcen.Sk.Alpha {
	// 	println(key, "\n", string(value.Bytes()), "\n", string(auth_tlemcen.Sk.Alpha[key].Bytes()), "\n\n")
	// }

	// JSONdata, err = os.ReadFile("auth_tlemcen_public_key.json")
	// if err != nil {
	// 	panic(err)
	// }
	// loadedPK := loadAuthPublicKey(JSONdata)

	// 	user_attributes_tlemcen := []string{"tlemcen:etudiant", "tlemcen:prof"}
	// 	keys1, err := loadedAuth_tlemcen.GenerateAttribKeys("mohammed", user_attributes_tlemcen)
	// 	if err != nil {
	// 		panic(err)
	// 	}

	// 	saveUserKeys(keys1)

	// 	authorities_public_key := []*abe.MAABEPubKey{auth_tlemcen.PubKeys()}
	// 	msg := "hello!"
	// 	access_policy, _ := abe.BooleanToMSP("( (tlemcen:prof ) OR (tlemcen:etudiant))", false)
	// 	cyphertext, _ := maabe.Encrypt(msg, access_policy, authorities_public_key)

	// 	// print(cyphertext)
	// 	saveCyphertext(cyphertext)

	// 	JSONdata, err = os.ReadFile("cyphertext.json")
	// 	if err != nil {
	// 		panic(err)
	// 	}
	// 	laodedCyphertext := loadCyphertext(JSONdata)

	// 	// if reflect.DeepEqual(cyphertext.Msp, laodedCyphertext.Msp) {
	// 	// 	println("true")
	// 	// } else {
	// 	// 	println("false")
	// 	// }

	// 	JSONdata, err = os.ReadFile("mohammed_keys.json")
	// 	if err != nil {
	// 		panic(err)
	// 	}
	// 	keys := loadUserKeys(JSONdata)

	// 	plaintext, _ := maabe.Decrypt(laodedCyphertext, keys)
	// 	println(plaintext)

}

// 	maabe := abe.NewMAABE()

// 	attributes_tlemcen := []string{"tlemcen:etudiant", "tlemcen:prof", "tlemcen:encadrant"}
// 	attributes_oran := []string{"oran:etudiant", "oran:prof", "oran:assistant"}
// 	attributes_alger := []string{"alger:prof"}

// 	auth_tlemcen, _ := maabe.NewMAABEAuth("tlemcen", attributes_tlemcen)
// 	auth_oran, _ := maabe.NewMAABEAuth("oran", attributes_oran)
// 	auth_alger, _ := maabe.NewMAABEAuth("alger", attributes_alger)

// 	authorities_public_key := []*abe.MAABEPubKey{auth_tlemcen.PubKeys(), auth_oran.PubKeys(), auth_alger.PubKeys()}

// 	user_gid := "mohammed"
// 	user_attributes_tlemcen := []string{"tlemcen:etudiant", "tlemcen:prof"}
// 	user_attributes_oran := []string{"oran:etudiant"}
// 	keys1, _ := auth_tlemcen.GenerateAttribKeys(user_gid, user_attributes_tlemcen)
// 	keys2, _ := auth_oran.GenerateAttribKeys(user_gid, user_attributes_oran)

// 	user_keys := []*abe.MAABEKey{keys1[0], keys1[1], keys2[0]}
// 	println(user_keys)

// 	msg := "hello!"
// 	access_policy, _ := abe.BooleanToMSP("( (tlemcen:encadrant AND oran:prof) OR (tlemcen:etudiant AND oran:assistant) OR alger:prof)", false)
// 	cyphertext, _ := maabe.Encrypt(msg, access_policy, authorities_public_key)

// 	plaintext, _ := maabe.Decrypt(cyphertext, user_keys)
// 	println(plaintext == msg)

// 	access_policy_2, _ := abe.BooleanToMSP("(oran:prof)", false)
// 	cyphertext_2, _ := maabe.Encrypt(msg, access_policy_2, authorities_public_key)

// 	plaintext_2, _ := maabe.Decrypt(cyphertext_2, user_keys)
// 	println(plaintext_2 == msg)

// }

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
