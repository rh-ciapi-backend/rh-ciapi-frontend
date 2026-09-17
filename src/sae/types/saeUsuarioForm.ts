export interface SaeUsuarioForm {
  prontuario: string;
  turno: 'MANHÃ' | 'TARDE' | '';
  nome: string;
  sexo: string;
  nacionalidade: string;
  rg: string;
  cpf: string;
  dataNascimento: string;
  cartaoSus: string;
  dataIngresso: string;
  situacaoCadastral: 'ATIVO' | 'INATIVO';
  dataDesligamento?: string;
  motivoDesligamento?: string;
  raca: string;
  escolaridade?: string;
  faixaRenda?: string;
  possuiDeficiencia: boolean;
  tipoDeficiencia: string;
  observacao: string;
  endereco: {
    logradouro: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    uf: string;
    cep: string;
  };
  contatos: Array<{
    telefone: string;
    nomeContato: string;
    parentesco: string;
    tipo: string;
    observacao: string;
    principal: boolean;
  }>;
}
