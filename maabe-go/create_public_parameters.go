// package main

// import (
// 	"encoding/json"
// 	"fmt"
// 	"os"

// 	"github.com/fentec-project/gofe/abe"
// )

// type PublicParameters_JSON struct {
// 	P  []byte `json:"P"`
// 	G1 []byte `json:"G1"`
// 	G2 []byte `json:"G2"`
// 	Gt []byte `json:"Gt"`
// }

// func SavePublicParameters(maabe *abe.MAABE, path string) string {

// 	pk := PublicParameters_JSON{
// 		P:  maabe.P.Bytes(),
// 		G1: maabe.G1.Marshal(),
// 		G2: maabe.G2.Marshal(),
// 		Gt: maabe.Gt.Marshal(),
// 	}

// 	jsonData, err := json.Marshal(pk)
// 	if err != nil {
// 		panic(err)
// 	}

// 	err = os.WriteFile(path, jsonData, 0644)
// 	if err != nil {
// 		panic(err)
// 	}
// 	return string(jsonData)
// }

// func main() {
// 	args := os.Args[1:]
// 	public_parameter := abe.NewMAABE()

// 	public_parameter_json := SavePublicParameters(public_parameter, args[0])
// 	fmt.Print(public_parameter_json)
// }
