import React, { useState, useEffect, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import ptBrLocale from "@fullcalendar/core/locales/pt-br";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// --- ESTILOS VISUAIS ---
const ESTILOS = {
  container: {
    fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    padding: "20px",
    maxWidth: "1280px",
    margin: "0 auto",
    backgroundColor: "#f1f5f9",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    textAlign: "center",
    marginBottom: "20px",
    color: "#1e293b",
    borderBottom: "2px solid #cbd5e1",
    paddingBottom: "10px",
  },
  menu: {
    display: "flex",
    gap: "10px",
    marginBottom: "20px",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  btnMenu: (ativo) => ({
    padding: "12px 25px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    backgroundColor: ativo ? "#2563eb" : "#ffffff",
    color: ativo ? "white" : "#64748b",
    fontWeight: "bold",
    fontSize: "14px",
    boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
    transition: "0.2s",
  }),
  card: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "25px",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
    border: "1px solid #e2e8f0",
    flex: 1,
  },
  controlBar: {
    display: "flex",
    gap: "15px",
    alignItems: "center",
    marginBottom: "20px",
    padding: "15px",
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    flexWrap: "wrap",
  },
  input: {
    padding: "8px 12px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
  },
  btnAcao: {
    padding: "8px 16px",
    backgroundColor: "#16a34a",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
  },
  btnPDF: {
    padding: "10px 20px",
    backgroundColor: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "5px",
  },
  btnLimpar: {
    padding: "10px 20px",
    backgroundColor: "#dc2626",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "600",
  },
  turmaTag: (cor, ativa) => ({
    backgroundColor: cor,
    color: "white",
    padding: "6px 12px",
    border: ativa ? "3px solid #1e293b" : "3px solid transparent",
    borderRadius: "20px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "bold",
    boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
  }),
  aviso: {
    backgroundColor: "#eff6ff",
    color: "#1e40af",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "15px",
    borderLeft: "4px solid #3b82f6",
    fontSize: "14px",
  },
  tabelaContainer: {
    marginTop: "30px",
    display: "grid",
    gridTemplateColumns: "1.5fr 1fr",
    gap: "30px",
  },
  tabela: { width: "100%", borderCollapse: "collapse", fontSize: "13px" },
  th: {
    backgroundColor: "#f1f5f9",
    padding: "10px",
    textAlign: "left",
    borderBottom: "2px solid #cbd5e1",
    color: "#475569",
  },
  td: { padding: "8px", borderBottom: "1px solid #e2e8f0", color: "#334155" },
  footer: {
    textAlign: "center",
    marginTop: "40px",
    paddingTop: "20px",
    borderTop: "1px solid #e2e8f0",
    color: "#94a3b8",
    fontSize: "12px",
  },
};

const CORES_TURMAS = [
  "#2563eb",
  "#059669",
  "#7c3aed",
  "#d97706",
  "#db2777",
  "#0891b2",
  "#dc2626",
];

export default function App() {
  const [aba, setAba] = useState("cadastro");
  const [mesSelecionado, setMesSelecionado] = useState(
    new Date().toISOString().slice(0, 7)
  );

  // --- DADOS ---
  const [turmas, setTurmas] = useState(
    () => JSON.parse(localStorage.getItem("db_turmas")) || []
  );
  const [professores, setProfessores] = useState(
    () => JSON.parse(localStorage.getItem("db_professores")) || []
  );
  const [aulas, setAulas] = useState(
    () => JSON.parse(localStorage.getItem("db_aulas")) || []
  );
  const [resultado, setResultado] = useState([]);

  // --- CONTROLES ---
  const [turmaAtiva, setTurmaAtiva] = useState(null);
  const [horaInicio, setHoraInicio] = useState("18:30");

  // ALTERAÇÃO AQUI: Ambos iniciam com 2
  const [qtdAulas, setQtdAulas] = useState(2);
  const [qtdProfs, setQtdProfs] = useState(2);

  const [vinculoPendente, setVinculoPendente] = useState(null);

  const calendarRefCadastro = useRef(null);

  useEffect(() => {
    localStorage.setItem("db_turmas", JSON.stringify(turmas));
    localStorage.setItem("db_professores", JSON.stringify(professores));
    localStorage.setItem("db_aulas", JSON.stringify(aulas));
  }, [turmas, professores, aulas]);

  useEffect(() => {
    if (calendarRefCadastro.current) {
      calendarRefCadastro.current.getApi().gotoDate(mesSelecionado + "-01");
    }
  }, [mesSelecionado]);

  // --- FUNÇÕES ---

  const adicionarTurma = () => {
    const nome = prompt("Nome da Turma:");
    if (!nome) return;
    const nova = {
      id: Date.now(),
      nome,
      cor: CORES_TURMAS[turmas.length % CORES_TURMAS.length],
    };
    setTurmas([...turmas, nova]);
    setTurmaAtiva(nova.id);
  };

  const gerenciarCliqueData = (info) => {
    if (vinculoPendente) return;
    if (!turmaAtiva) return alert("⚠️ Selecione uma TURMA antes.");

    const turmaObj = turmas.find((t) => t.id === turmaAtiva);
    const idUnico = `${turmaAtiva}-${info.dateStr}-${horaInicio}`;

    if (aulas.find((a) => a.id === idUnico)) {
      setAulas((prev) => prev.filter((a) => a.id !== idUnico));
    } else {
      setAulas((prev) => [
        ...prev,
        {
          id: idUnico,
          turmaId: turmaObj.id,
          turmaNome: turmaObj.nome,
          turmaCor: turmaObj.cor,
          date: info.dateStr,
          horaInicio,
          qtdAulas,
          qtdProfs,
          vinculoId: null,
        },
      ]);
    }
  };

  const gerenciarVincular = (e, aulaId) => {
    e.stopPropagation();
    if (vinculoPendente === aulaId) {
      setVinculoPendente(null);
      return;
    }
    if (!vinculoPendente) {
      setVinculoPendente(aulaId);
    } else {
      const novoVinculoId = `VINC-${Date.now()}`;
      setAulas((prev) =>
        prev.map((a) => {
          if (a.id === vinculoPendente || a.id === aulaId) {
            return { ...a, vinculoId: novoVinculoId };
          }
          return a;
        })
      );
      setVinculoPendente(null);
      alert("✅ Aulas vinculadas!");
    }
  };

  const calcularDistribuicao = () => {
    const horasProfessor = {};
    professores.forEach((p) => (horasProfessor[p.id] = 0));
    const ocupacao = new Set();
    const memoriaVinculos = {};

    const aulasDistribuidas = aulas.map((aula) => {
      let profsSelecionados = [];
      const chaveVinculo = aula.vinculoId
        ? `${aula.vinculoId}-${aula.date}`
        : null;
      const vagas = aula.qtdProfs || 1;

      if (chaveVinculo && memoriaVinculos[chaveVinculo]) {
        profsSelecionados = memoriaVinculos[chaveVinculo];
        profsSelecionados.forEach((p) => {
          horasProfessor[p.id] += aula.qtdAulas;
          ocupacao.add(`${p.id}-${aula.date}-${aula.horaInicio}`);
        });
      } else {
        const disponiveis = professores.filter(
          (p) =>
            p.disponibilidade.includes(aula.date) &&
            !ocupacao.has(`${p.id}-${aula.date}-${aula.horaInicio}`)
        );

        disponiveis.sort((a, b) => horasProfessor[a.id] - horasProfessor[b.id]);
        profsSelecionados = disponiveis.slice(0, vagas);

        profsSelecionados.forEach((p) => {
          horasProfessor[p.id] += aula.qtdAulas;
          ocupacao.add(`${p.id}-${aula.date}-${aula.horaInicio}`);
        });

        if (chaveVinculo && profsSelecionados.length > 0)
          memoriaVinculos[chaveVinculo] = profsSelecionados;
      }

      const nomesFormatados =
        profsSelecionados.length > 0
          ? profsSelecionados.map((p) => p.nome).join(", ")
          : "⚠️ PENDENTE";

      return {
        id: aula.id,
        title: `${aula.turmaNome}`,
        date: aula.date,
        backgroundColor:
          profsSelecionados.length === vagas
            ? aula.turmaCor
            : profsSelecionados.length > 0
            ? "#f59e0b"
            : "#ef4444",
        extendedProps: {
          turma: aula.turmaNome,
          turmaId: aula.turmaId,
          horaInicio: aula.horaInicio,
          profIds: profsSelecionados.map((p) => p.id),
          profNomes: nomesFormatados,
          qtd: aula.qtdAulas,
        },
      };
    });

    setResultado(aulasDistribuidas);
    setAba("relatorio");
  };

  const gerarPDF = async () => {
    const elemento = document.getElementById("area-relatorio-pdf");
    if (!elemento) return;

    const canvas = await html2canvas(elemento, {
      scale: 2,
      useCORS: true,
      scrollY: -window.scrollY,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("l", "mm", "a4");

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgProps = pdf.getImageProperties(imgData);
    const ratio = imgProps.width / imgProps.height;
    const finalHeight = pdfWidth / ratio;

    if (finalHeight > pdfHeight) {
      const finalWidth = pdfHeight * ratio;
      pdf.addImage(
        imgData,
        "PNG",
        (pdfWidth - finalWidth) / 2,
        0,
        finalWidth,
        pdfHeight
      );
    } else {
      pdf.addImage(imgData, "PNG", 0, 10, pdfWidth, finalHeight);
    }

    pdf.save(`Escala_ACADEPOL_${mesSelecionado}.pdf`);
  };

  const resumoProfessores = professores
    .map((p) => {
      const aulasDoProf = resultado.filter(
        (r) => r.extendedProps.profIds && r.extendedProps.profIds.includes(p.id)
      );
      const totalGeral = aulasDoProf.reduce(
        (acc, curr) => acc + curr.extendedProps.qtd,
        0
      );
      const detalheTurmas = turmas
        .map((t) => {
          const qtdNaTurma = aulasDoProf
            .filter((a) => a.extendedProps.turmaId === t.id)
            .reduce((acc, curr) => acc + curr.extendedProps.qtd, 0);
          return qtdNaTurma > 0 ? `${t.nome}: ${qtdNaTurma}` : null;
        })
        .filter(Boolean)
        .join(", ");
      return { nome: p.nome, total: totalGeral, detalhe: detalheTurmas };
    })
    .filter((item) => item.total > 0)
    .sort((a, b) => b.total - a.total);

  const resumoTurmas = turmas
    .map((t) => ({
      nome: t.nome,
      total: resultado
        .filter((r) => r.extendedProps.turma === t.nome)
        .reduce((acc, curr) => acc + curr.extendedProps.qtd, 0),
    }))
    .sort((a, b) => b.total - a.total);

  return (
    <div style={ESTILOS.container}>
      <header style={ESTILOS.header}>
        <h1>🏛️ ACADEPOL - Gestão de Escalas</h1>
        <p style={{ color: "#64748b" }}>
          Sistema Integrado de Distribuição de Aulas
        </p>
      </header>

      <div style={ESTILOS.menu}>
        <button
          style={ESTILOS.btnMenu(aba === "cadastro")}
          onClick={() => setAba("cadastro")}
        >
          1. Cadastrar Aulas
        </button>
        <button
          style={ESTILOS.btnMenu(aba === "professores")}
          onClick={() => setAba("professores")}
        >
          2. Disponibilidade Professores
        </button>
        <button
          style={ESTILOS.btnMenu(aba === "relatorio")}
          onClick={calcularDistribuicao}
        >
          3. Gerar Relatório
        </button>
      </div>

      <div style={ESTILOS.card}>
        {/* ABA 1: CADASTRO */}
        {aba === "cadastro" && (
          <>
            <div style={ESTILOS.controlBar}>
              <button onClick={adicionarTurma} style={ESTILOS.btnAcao}>
                + Nova Turma
              </button>
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  flex: 1,
                  justifyContent: "center",
                }}
              >
                <input
                  type="month"
                  value={mesSelecionado}
                  onChange={(e) => setMesSelecionado(e.target.value)}
                  style={ESTILOS.input}
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ fontSize: "14px" }}>Horário:</span>
                <input
                  type="time"
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                  style={ESTILOS.input}
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ fontSize: "14px" }}>Carga:</span>
                <input
                  type="number"
                  value={qtdAulas}
                  onChange={(e) => setQtdAulas(Number(e.target.value))}
                  style={{ ...ESTILOS.input, width: "50px" }}
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ fontSize: "14px" }}>Profs:</span>
                <input
                  type="number"
                  min="1"
                  value={qtdProfs}
                  onChange={(e) => setQtdProfs(Number(e.target.value))}
                  style={{ ...ESTILOS.input, width: "50px" }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "5px",
                  flexWrap: "wrap",
                  marginLeft: "auto",
                }}
              >
                {turmas.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTurmaAtiva(t.id)}
                    style={ESTILOS.turmaTag(t.cor, turmaAtiva === t.id)}
                  >
                    {t.nome}
                  </button>
                ))}
              </div>
            </div>

            <FullCalendar
              ref={calendarRefCadastro}
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              locale={ptBrLocale}
              dateClick={gerenciarCliqueData}
              eventClick={(info) => {
                if (!vinculoPendente && !info.event.extendedProps.vinculoId) {
                  if (window.confirm("Remover aula?"))
                    setAulas((prev) =>
                      prev.filter((a) => a.id !== info.event.id)
                    );
                } else {
                  const e = { stopPropagation: () => {} };
                  gerenciarVincular(e, info.event.id);
                }
              }}
              events={aulas.map((a) => ({
                id: a.id,
                date: a.date,
                backgroundColor: a.turmaCor,
                extendedProps: { ...a },
              }))}
              eventContent={(arg) => (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "2px 4px",
                    border:
                      vinculoPendente === arg.event.id
                        ? "2px solid #fbbf24"
                        : "1px solid transparent",
                    borderRadius: "3px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "10px",
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {arg.event.extendedProps.vinculoId ? "🔗 " : ""}
                    {arg.event.extendedProps.turmaNome}
                  </div>
                  <button
                    onClick={(e) => gerenciarVincular(e, arg.event.id)}
                    style={{
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                    }}
                  >
                    🔗
                  </button>
                </div>
              )}
            />
          </>
        )}

        {/* ABA 2: PROFESSORES */}
        {aba === "professores" && (
          <>
            <div style={ESTILOS.controlBar}>
              <button
                onClick={() => {
                  const n = prompt("Nome do Professor:");
                  if (n)
                    setProfessores([
                      ...professores,
                      { id: Date.now(), nome: n, disponibilidade: [] },
                    ]);
                }}
                style={ESTILOS.btnAcao}
              >
                + Cadastrar Professor
              </button>
              <div style={{ fontSize: "14px", color: "#64748b" }}>
                Clique nos dias para marcar disponibilidade.
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: "20px",
              }}
            >
              {professores.map((p) => (
                <div
                  key={p.id}
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    padding: "15px",
                    backgroundColor: "#f8fafc",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "10px",
                    }}
                  >
                    <h3
                      style={{ margin: 0, fontSize: "16px", color: "#334155" }}
                    >
                      {p.nome}
                    </h3>
                    <button
                      onClick={() =>
                        setProfessores((prev) =>
                          prev.filter((x) => x.id !== p.id)
                        )
                      }
                      style={{
                        ...ESTILOS.btnAcao,
                        backgroundColor: "#ef4444",
                        fontSize: "10px",
                        padding: "4px 8px",
                      }}
                    >
                      Excluir
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
                    dateClick={(info) => {
                      setProfessores((prev) =>
                        prev.map((prof) =>
                          prof.id === p.id
                            ? {
                                ...prof,
                                disponibilidade: prof.disponibilidade.includes(
                                  info.dateStr
                                )
                                  ? prof.disponibilidade.filter(
                                      (d) => d !== info.dateStr
                                    )
                                  : [...prof.disponibilidade, info.dateStr],
                              }
                            : prof
                        )
                      );
                    }}
                    events={p.disponibilidade.map((d) => ({
                      display: "background",
                      date: d,
                      color: "#22c55e",
                    }))}
                  />
                </div>
              ))}
            </div>
          </>
        )}

        {/* ABA 3: RELATÓRIO */}
        {aba === "relatorio" && (
          <>
            <div style={ESTILOS.controlBar}>
              <div style={{ display: "flex", gap: "10px", flex: 1 }}>
                <input
                  type="month"
                  value={mesSelecionado}
                  onChange={(e) => setMesSelecionado(e.target.value)}
                  style={ESTILOS.input}
                />
                <button onClick={gerarPDF} style={ESTILOS.btnPDF}>
                  📄 Baixar PDF Completo
                </button>
              </div>
              <button
                onClick={() => {
                  if (window.confirm("Zerar tudo?")) {
                    localStorage.clear();
                    window.location.reload();
                  }
                }}
                style={ESTILOS.btnLimpar}
              >
                🗑️ Limpar Tudo
              </button>
            </div>

            <div
              id="area-relatorio-pdf"
              style={{ padding: "20px", backgroundColor: "white" }}
            >
              <div
                style={{
                  textAlign: "center",
                  marginBottom: "20px",
                  borderBottom: "2px solid #000",
                  paddingBottom: "10px",
                }}
              >
                <h1 style={{ fontSize: "24px", margin: 0 }}>
                  ACADEPOL - ESCALA DE ENSINO
                </h1>
                <p style={{ margin: 0, fontSize: "14px" }}>
                  Relatório de Distribuição Mensal - {mesSelecionado}
                </p>
              </div>

              <FullCalendar
                key={mesSelecionado}
                plugins={[dayGridPlugin]}
                initialView="dayGridMonth"
                initialDate={mesSelecionado + "-01"}
                locale={ptBrLocale}
                events={resultado}
                headerToolbar={{ left: "", center: "title", right: "" }}
                height="auto"
                eventContent={(arg) => (
                  <div
                    style={{
                      fontSize: "10px",
                      textAlign: "center",
                      lineHeight: "1.2",
                    }}
                  >
                    <strong>
                      {arg.event.extendedProps.turma} -{" "}
                      {arg.event.extendedProps.horaInicio}
                    </strong>
                    <br />
                    {arg.event.extendedProps.profNomes}
                  </div>
                )}
              />

              <div style={ESTILOS.tabelaContainer}>
                <div>
                  <h3
                    style={{
                      borderBottom: "2px solid #2563eb",
                      color: "#1e3a8a",
                      paddingBottom: "5px",
                    }}
                  >
                    📊 Aulas por Professor
                  </h3>
                  <table style={ESTILOS.tabela}>
                    <thead>
                      <tr>
                        <th style={ESTILOS.th}>Professor</th>
                        <th style={ESTILOS.th}>Detalhamento</th>
                        <th style={ESTILOS.th}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resumoProfessores.map((r, i) => (
                        <tr
                          key={i}
                          style={{
                            backgroundColor: i % 2 === 0 ? "white" : "#f8fafc",
                          }}
                        >
                          <td style={ESTILOS.td}>{r.nome}</td>
                          <td style={ESTILOS.td}>
                            <small>{r.detalhe}</small>
                          </td>
                          <td style={ESTILOS.td}>
                            <strong>{r.total}</strong>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div>
                  <h3
                    style={{
                      borderBottom: "2px solid #2563eb",
                      color: "#1e3a8a",
                      paddingBottom: "5px",
                    }}
                  >
                    📚 Aulas por Turma
                  </h3>
                  <table style={ESTILOS.tabela}>
                    <thead>
                      <tr>
                        <th style={ESTILOS.th}>Turma</th>
                        <th style={ESTILOS.th}>Carga Horária</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resumoTurmas.map((r, i) => (
                        <tr
                          key={i}
                          style={{
                            backgroundColor: i % 2 === 0 ? "white" : "#f8fafc",
                          }}
                        >
                          <td style={ESTILOS.td}>{r.nome}</td>
                          <td style={ESTILOS.td}>
                            <strong>{r.total}</strong>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div
                style={{
                  textAlign: "right",
                  marginTop: "30px",
                  fontSize: "10px",
                  color: "#94a3b8",
                }}
              >
                Desenvolvido por Gustavo Lazzarotto Demarco
              </div>
            </div>
          </>
        )}
      </div>

      <footer style={ESTILOS.footer}>
        Desenvolvido por Gustavo Lazzarotto Demarco
      </footer>
    </div>
  );
}
