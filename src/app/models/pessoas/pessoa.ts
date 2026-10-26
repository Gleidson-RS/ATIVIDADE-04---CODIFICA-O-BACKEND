import { Enderecos } from "../enderecos/enderecos"

export class Pessoas{
    id: number = 0
    nome: string = ''
    CPF: number = 0
    datanascimento: string = ''
    sexo: string = ''
    email: string = ''
    telefone: number = 0
    AtivoPessoa: string = ''
    Enderecos: Enderecos[] = [];
}