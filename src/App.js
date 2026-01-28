import React, { useState, useEffect, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import ptBrLocale from "@fullcalendar/core/locales/pt-br";
import jsPDF from "jspdf";
import html2canvas from "html2canvas"; // Importante: Adicione essa dependência

// --- CONFIGURAÇÃO VISUAL (ESTILOS) ---
const ESTILOS = {
  container: {
    fontFamily: "Arial, sans-serif",
    padding: "20px",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  header: { textAlign: "center", marginBottom: "30px", color: "#333" },
  menu: {
    display: "flex",
    gap: "10px",
    marginBottom: "20px",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  btnMenu: (ativo) => ({
    padding: "10px 20px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    backgroundColor: ativo ? "#2563eb" : "#e5e7eb",
    color: ativo ? "white" : "#374151",
    fontWeight: "bold",
    fontSize: "14px",
  }),
  card: {
    border: "1px solid #ddd",
    borderRadius: "8px",
    padding: "15px",
    marginBottom: "20px",
    backgroundColor: "white",
  },
  inputGroup: {
    display: "flex",
    gap: "15px",
    alignItems: "center",
    marginBottom: "15px",
    flexWrap: "wrap",
  },
  input: { padding: "8px", borderRadius: "4px", border: "1px solid #ccc" },
  btnAcao: {
    padding: "8px 16px",
    backgroundColor: "#16a34a",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  btnDelete: {
    backgroundColor: "#ef4444",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    marginLeft: "5px",
    padding: "2px 6px",
    fontSize: "12px",
    fontWeight: "bold",
  },
  aviso: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
    padding: "10px",
    borderRadius: "4px",
    marginBottom: "10px",
  },
};

const CORES_DISPONIVEIS = [
  "#2563eb",
  "#16a34a",
  "#7c3aed",
  "#ea580c",
  "#0d9488",
  "#db2777",
  "#8b5cf6",
  "#f43f5e",
  "#1e40af",
  "#b91c1c",
];

export default function App() {
  // --- ESTADOS (DADOS) ---
  const [aba, setAba] = useState("disciplina");

  // Referência para controlar o calendário visualmente
  const calendarRef = useRef(null);

  const [turmas, setTurmas] = useState(
    () => JSON.parse(localStorage.getItem("turmas")) || []
  );
  const [professores, setProfessores] = useState(
    () => JSON.parse(localStorage.getItem("professores")) || []
  );
  const [aulas, setAulas] = useState(
    () => JSON.parse(localStorage.getItem("aulas")) || []
  );
  const [distribuicao, setDistribuicao] = useState(
    () => JSON.parse(localStorage.getItem("distribuicao")) || []
  );

  const [turmaAtiva, setTurmaAtiva] = useState(null);

  // Inputs da aula
  const [horaInicio, setHoraInicio] = useState("");
  const [quantidadeAulas, setQuantidadeAulas] = useState(1);
  const [qtdProfessoresNecessarios, setQtdProfessoresNecessarios] = useState(1);

  // Controle do Mês de Interesse (Padrão: Mês Atual)
  const [mesSelecionado, setMesSelecionado] = useState(
    new Date().toISOString().slice(0, 7)
  ); // Formato YYYY-MM

  // --- SALVAR AUTOMATICAMENTE ---
  useEffect(() => {
    localStorage.setItem("turmas", JSON.stringify(turmas));
  }, [turmas]);
  useEffect(() => {
    localStorage.setItem("professores", JSON.stringify(professores));
  }, [professores]);
  useEffect(() => {
    localStorage.setItem("aulas", JSON.stringify(aulas));
  }, [aulas]);
  useEffect(() => {
    localStorage.setItem("distribuicao", JSON.stringify(distribuicao));
  }, [distribuicao]);

  // Função para mudar o calendário quando o usuário troca o input de mês
  useEffect(() => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.gotoDate(mesSelecionado + "-01");
    }
  }, [mesSelecionado, aba]); // Executa quando muda o mês ou a aba

  // --- FUNÇÕES DE TURMA ---
  function adicionarTurma() {
    const nome = prompt("Nome da turma (Ex: Turma Golf - Agentes):");
    if (!nome) return;
    const cor = CORES_DISPONIVEIS[turmas.length % CORES_DISPONIVEIS.length];
    const nova = { id: Date.now(), nome, cor };
    setTurmas([...turmas, nova]);
    setTurmaAtiva(nova.id);
  }

  function removerTurma(id) {
    if (
      window.confirm(
        "Tem certeza? Isso apagará a turma e todas as aulas agendadas para ela."
      )
    ) {
      setTurmas((prev) => prev.filter((t) => t.id !== id));
      setAulas((prev) => prev.filter((a) => a.turmaId !== id));
      if (turmaAtiva === id) setTurmaAtiva(null);
    }
  }

  function toggleAula(info) {
    if (!turmaAtiva)
      return alert(
        "Selecione uma turma primeiro (botões acima do calendário)."
      );
    if (!horaInicio) return alert("Defina o horário de início da aula.");

    const turma = turmas.find((t) => t.id === turmaAtiva);
    const idAula = `${turmaAtiva}-${info.dateStr}-${horaInicio}`;

    const existe = aulas.find((a) => a.id === idAula);

    if (existe) {
      setAulas((prev) => prev.filter((a) => a.id !== idAula));
    } else {
      setAulas((prev) => [
        ...prev,
        {
          id: idAula,
          turmaId: turma.id,
          turmaNome: turma.nome,
          turmaCor: turma.cor,
          date: info.dateStr,
          horaInicio,
          quantidadeAulas,
          qtdProfessoresNecessarios, // Salvamos quantos professores essa aula exige
        },
      ]);
    }
  }

  // --- FUNÇÕES DE PROFESSOR ---
  function adicionarProfessor() {
    const nome = prompt("Nome do professor:");
    if (!nome) return;
    setProfessores((prev) => [
      ...prev,
      { id: Date.now(), nome, disponibilidade: [] },
    ]);
  }

  function removerProfessor(id) {
    if (window.confirm("Tem certeza que deseja remover este professor?")) {
      setProfessores((prev) => prev.filter((p) => p.id !== id));
    }
  }

  function toggleDisponibilidade(profId, info) {
    setProfessores((prev) =>
      prev.map((p) => {
        if (p.id !== profId) return p;
        const jaDisponivel = p.disponibilidade.includes(info.dateStr);
        return {
          ...p,
          disponibilidade: jaDisponivel
            ? p.disponibilidade.filter((d) => d !== info.dateStr)
            : [...p.disponibilidade, info.dateStr],
        };
      })
    );
  }

  // --- LÓGICA DE DISTRIBUIÇÃO ---
  function distribuirAulas() {
    const contadorAulas = {};
    professores.forEach((p) => (contadorAulas[p.id] = 0));
    const ocupacaoProfessor = new Set();
    const resultado = [];

    for (const aula of aulas) {
      const vagas = aula.qtdProfessoresNecessarios || 1;
      let candidatos = professores.filter((p) =>
        p.disponibilidade.includes(aula.date)
      );

      candidatos = candidatos.filter((p) => {
        const chaveOcupacao = `${p.id}-${aula.date}-${aula.horaInicio}`;
        return !ocupacaoProfessor.has(chaveOcupacao);
      });

      candidatos.sort((a, b) => contadorAulas[a.id] - contadorAulas[b.id]);
      const selecionados = candidatos.slice(0, vagas);

      if (selecionados.length > 0) {
        const nomesSelecionados = [];
        const idsSelecionados = [];

        selecionados.forEach((prof) => {
          ocupacaoProfessor.add(`${prof.id}-${aula.date}-${aula.horaInicio}`);
          contadorAulas[prof.id] += aula.quantidadeAulas;
          nomesSelecionados.push(prof.nome);
          idsSelecionados.push(prof.id);
        });

        resultado.push({
          id: aula.id,
          turmaId: aula.turmaId,
          date: aula.date,
          backgroundColor: aula.turmaCor,
          extendedProps: {
            ...aula,
            professorNome: nomesSelecionados.join(", "),
            professorIds: idsSelecionados,
          },
        });
      } else {
        resultado.push({
          id: aula.id,
          turmaId: aula.turmaId,
          date: aula.date,
          backgroundColor: "#ef4444",
          extendedProps: {
            ...aula,
            professorNome: "Ninguém Disponível",
            professorIds: [],
          },
        });
      }
    }
    setDistribuicao(resultado);
    setAba("visao-geral");
  }

  // --- RELATÓRIO PDF COM VISUAL E MESES ---
  async function exportarPDF() {
    // 1. Captura o elemento do calendário no DOM
    const calendarioElement = document.getElementById(
      "calendario-visual-final"
    );

    if (!calendarioElement) return alert("Erro ao encontrar o calendário.");

    // Feedback visual que está processando
    const btn = document.getElementById("btn-pdf");
    if (btn) btn.innerText = "Gerando PDF...";

    try {
      // Tira o "print" do calendário
      const canvas = await html2canvas(calendarioElement, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");

      const doc = new jsPDF("p", "mm", "a4");
      const width = doc.internal.pageSize.getWidth();

      // PÁGINA 1: CALENDÁRIO VISUAL
      doc.setFontSize(18);
      doc.text(`Calendário Visual - ${mesSelecionado}`, 10, 15);

      // Adiciona a imagem do calendário (ajustando largura para caber no A4)
      const imgProps = doc.getImageProperties(imgData);
      const pdfHeight = (imgProps.height * (width - 20)) / imgProps.width;
      doc.addImage(imgData, "PNG", 10, 25, width - 20, pdfHeight);

      // PÁGINA 2: RELATÓRIO TEXTUAL
      doc.addPage();
      doc.setFontSize(18);
      doc.text("Relatório Detalhado de Aulas", 10, 20);

      let y = 40;

      professores.forEach((p) => {
        // Filtra aulas deste professor
        const aulasDoProf = distribuicao.filter(
          (d) =>
            d.extendedProps.professorIds &&
            d.extendedProps.professorIds.includes(p.id)
        );

        const totalGeral = aulasDoProf.reduce(
          (acc, curr) => acc + curr.extendedProps.quantidadeAulas,
          0
        );

        // AGORA AGRUPAMOS POR MÊS
        const porMes = {};
        aulasDoProf.forEach((aula) => {
          const mesAno = aula.date.substring(0, 7); // Pega "2024-02"
          const qtd = aula.extendedProps.quantidadeAulas;
          porMes[mesAno] = (porMes[mesAno] || 0) + qtd;
        });

        if (y > 250) {
          doc.addPage();
          y = 20;
        }

        // Nome do Professor
        doc.setFontSize(14);
        doc.setFont(undefined, "bold");
        doc.text(`Professor: ${p.nome}`, 10, y);
        doc.text(`Total Geral: ${totalGeral}`, 150, y);
        y += 8;

        doc.setFontSize(10);
        doc.setFont(undefined, "normal");

        // Lista discriminada por mês
        if (Object.keys(porMes).length === 0) {
          doc.text(" - Nenhuma aula atribuída.", 15, y);
          y += 6;
        } else {
          // Ordena os meses
          Object.keys(porMes)
            .sort()
            .forEach((mesKey) => {
              // Formata a data para ficar bonitinho (ex: 2024-02)
              const [ano, mes] = mesKey.split("-");
              doc.text(` - Mês ${mes}/${ano}: ${porMes[mesKey]} aulas`, 15, y);
              y += 5;
            });
        }
        y += 10;
      });

      doc.save(`relatorio_${mesSelecionado}.pdf`);
    } catch (err) {
      console.error(err);
      alert("Erro ao gerar imagem do calendário.");
    } finally {
      if (btn) btn.innerText = "📄 Baixar Relatório PDF";
    }
  }

  function limparDados() {
    if (
      window.confirm("Isso apagará TUDO (Turmas e Professores). Continuar?")
    ) {
      localStorage.clear();
      window.location.reload();
    }
  }

  // --- RENDERIZAÇÃO ---
  return (
    <div style={ESTILOS.container}>
      <h2 style={ESTILOS.header}>
        📅 Sistema de Gestão de Aulas - CFP 2026 - ACADEPOL
      </h2>

      <div style={ESTILOS.menu}>
        <button
          style={ESTILOS.btnMenu(aba === "disciplina")}
          onClick={() => setAba("disciplina")}
        >
          1. Cadastrar Turmas/Aulas
        </button>
        <button
          style={ESTILOS.btnMenu(aba === "professores")}
          onClick={() => setAba("professores")}
        >
          2. Cadastrar Professores
        </button>
        <button
          style={ESTILOS.btnMenu(aba === "visao-geral")}
          onClick={() => {
            distribuirAulas();
            setAba("visao-geral");
          }}
        >
          3. Resultado da Distribuição
        </button>
      </div>

      <div style={ESTILOS.card}>
        {/* ABA 1: DISCIPLINA */}
        {aba === "disciplina" && (
          <div>
            <div style={ESTILOS.aviso}>
              Crie a turma. Defina o horário e quantidade de professores.
            </div>

            <div style={ESTILOS.inputGroup}>
              <button onClick={adicionarTurma} style={ESTILOS.btnAcao}>
                + Nova Turma
              </button>
              <div
                style={{
                  borderLeft: "2px solid #ddd",
                  paddingLeft: 10,
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                {turmas.map((t) => (
                  <div
                    key={t.id}
                    style={{ display: "flex", alignItems: "center" }}
                  >
                    <button
                      onClick={() => setTurmaAtiva(t.id)}
                      style={{
                        padding: "5px 10px",
                        border:
                          turmaAtiva === t.id
                            ? "3px solid #000"
                            : "1px solid #ccc",
                        backgroundColor: t.cor,
                        color: "white",
                        textShadow: "0px 0px 3px #000",
                        cursor: "pointer",
                        borderRadius: 4,
                      }}
                    >
                      {t.nome}
                    </button>
                    <button
                      onClick={() => removerTurma(t.id)}
                      style={ESTILOS.btnDelete}
                      title="Excluir Turma"
                    >
                      X
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div style={ESTILOS.inputGroup}>
              <label>
                Horário Início:{" "}
                <input
                  type="time"
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                  style={ESTILOS.input}
                />
              </label>
              <label>
                Horas/aula:{" "}
                <input
                  type="number"
                  value={quantidadeAulas}
                  onChange={(e) => setQuantidadeAulas(Number(e.target.value))}
                  style={{ ...ESTILOS.input, width: 50 }}
                />
              </label>
              <label style={{ borderLeft: "2px solid #ddd", paddingLeft: 10 }}>
                Qtde Profs:
                <input
                  type="number"
                  min="1"
                  value={qtdProfessoresNecessarios}
                  onChange={(e) =>
                    setQtdProfessoresNecessarios(Number(e.target.value))
                  }
                  style={{ ...ESTILOS.input, width: 50, marginLeft: 5 }}
                />
              </label>
            </div>

            <FullCalendar
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              locale={ptBrLocale}
              dateClick={toggleAula}
              events={aulas.map((a) => ({
                date: a.date,
                backgroundColor: a.turmaCor,
                extendedProps: {
                  turmaNome: a.turmaNome,
                  horaInicio: a.horaInicio,
                  quantidadeAulas: a.quantidadeAulas,
                  qtdProfessores: a.qtdProfessoresNecessarios || 1,
                },
              }))}
              eventContent={(arg) => (
                <div
                  style={{
                    fontSize: "10px",
                    padding: "2px",
                    cursor: "pointer",
                  }}
                >
                  <b>
                    {arg.event.extendedProps.turmaNome} -{" "}
                    {arg.event.extendedProps.horaInicio} (
                    {arg.event.extendedProps.quantidadeAulas})
                  </b>
                  <br />
                  Profs: {arg.event.extendedProps.qtdProfessores}
                </div>
              )}
              height="auto"
            />
          </div>
        )}

        {/* ABA 2: PROFESSORES */}
        {aba === "professores" && (
          <div>
            <div style={ESTILOS.aviso}>
              Clique nos dias disponíveis do professor.
            </div>
            <button onClick={adicionarProfessor} style={ESTILOS.btnAcao}>
              + Adicionar Professor
            </button>
            <div style={{ marginTop: 20 }}>
              {professores.map((p) => (
                <div
                  key={p.id}
                  style={{
                    marginBottom: 30,
                    borderTop: "1px solid #eee",
                    paddingTop: 10,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <h3>{p.nome}</h3>
                    <button
                      onClick={() => removerProfessor(p.id)}
                      style={{ ...ESTILOS.btnDelete, padding: "5px 10px" }}
                    >
                      Excluir Professor
                    </button>
                  </div>
                  <FullCalendar
                    plugins={[dayGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    locale={ptBrLocale}
                    height="auto"
                    headerToolbar={{
                      left: "title",
                      center: "",
                      right: "prev,next",
                    }}
                    dateClick={(info) => toggleDisponibilidade(p.id, info)}
                    events={p.disponibilidade.map((d) => ({
                      display: "background",
                      date: d,
                      color: "#10b981",
                    }))}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABA 3: VISÃO GERAL */}
        {aba === "visao-geral" && (
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 20,
                alignItems: "center",
              }}
            >
              <h3>Resultado Final</h3>

              {/* NOVO SELETOR DE MÊS */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <label>Mês de Referência:</label>
                <input
                  type="month"
                  value={mesSelecionado}
                  onChange={(e) => setMesSelecionado(e.target.value)}
                  style={ESTILOS.input}
                />
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  id="btn-pdf"
                  onClick={exportarPDF}
                  style={ESTILOS.btnAcao}
                >
                  📄 Baixar Relatório PDF
                </button>
                <button
                  onClick={limparDados}
                  style={{ ...ESTILOS.btnAcao, backgroundColor: "#dc2626" }}
                >
                  🗑️ Limpar Tudo
                </button>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                marginBottom: 10,
              }}
            >
              {turmas.map((t) => (
                <div
                  key={t.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 12,
                  }}
                >
                  <div
                    style={{
                      width: 15,
                      height: 15,
                      backgroundColor: t.cor,
                      borderRadius: 3,
                    }}
                  ></div>
                  {t.nome}
                </div>
              ))}
            </div>

            {/* ID ADICIONADO AQUI PARA O PRINT DO PDF */}
            <div id="calendario-visual-final">
              <FullCalendar
                ref={calendarRef} // REFERÊNCIA PARA MUDAR O MÊS
                plugins={[dayGridPlugin]}
                initialView="dayGridMonth"
                locale={ptBrLocale}
                events={distribuicao}
                eventContent={(arg) => (
                  <div
                    style={{
                      fontSize: "10px",
                      padding: "2px",
                      cursor: "pointer",
                    }}
                    title={`Peso: ${arg.event.extendedProps.quantidadeAulas} aulas`}
                  >
                    <b>
                      {arg.event.extendedProps.turmaNome} -{" "}
                      {arg.event.extendedProps.horaInicio} (
                      {arg.event.extendedProps.quantidadeAulas})
                    </b>
                    <br />
                    {arg.event.extendedProps.professorNome}
                  </div>
                )}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
