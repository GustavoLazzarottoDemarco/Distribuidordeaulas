import React from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import ptBrLocale from "@fullcalendar/core/locales/pt-br";
import { ESTILOS } from "./styles";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function Relatorio({
  mesSelecionado,
  setMesSelecionado,
  limparDistribuicaoMesAtual,
  resultado,
  resumoProfessores,
}) {
  // --- FUNÇÃO 1: APENAS CALENDÁRIO ---
  const gerarPDFCalendario = async () => {
    const doc = new jsPDF("l", "mm", "a4"); // Landscape
    const calendarioDiv = document.getElementById("apenas-calendario");

    if (calendarioDiv) {
      // Feedback visual simples
      document.body.style.cursor = "wait";

      const canvas = await html2canvas(calendarioDiv, {
        scale: 2, // Alta resolução
        useCORS: true,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdfWidth = doc.internal.pageSize.getWidth();
      const pdfHeight = doc.internal.pageSize.getHeight();
      const imgProps = doc.getImageProperties(imgData);
      const ratio = imgProps.width / imgProps.height;
      const finalHeight = pdfWidth / ratio;

      // Cabeçalho
      doc.setFontSize(14);
      doc.text(`Escala CFP - ${mesSelecionado}`, 10, 10);

      // Centralizar imagem verticalmente se sobrar espaço
      if (finalHeight > pdfHeight - 20) {
        const finalWidth = (pdfHeight - 20) * ratio;
        doc.addImage(
          imgData,
          "PNG",
          (pdfWidth - finalWidth) / 2,
          15,
          finalWidth,
          pdfHeight - 20
        );
      } else {
        doc.addImage(imgData, "PNG", 0, 15, pdfWidth, finalHeight);
      }

      doc.save(`Calendario_${mesSelecionado}.pdf`);
      document.body.style.cursor = "default";
    } else {
      alert("Erro ao encontrar o calendário.");
    }
  };

  // --- FUNÇÃO 2: APENAS ESTATÍSTICAS ---
  const gerarPDFEstatisticas = () => {
    const doc = new jsPDF("l", "mm", "a4"); // Landscape

    // Título da Página
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Relatório Estatístico de Aulas", 14, 20);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Referência: ${mesSelecionado}`, 240, 20);

    // Cabeçalho da Tabela
    const desenharCabecalho = (yPos) => {
      doc.setFontSize(10);
      doc.setFillColor(230, 230, 230);
      doc.rect(14, yPos, 270, 8, "F");
      doc.setFont("helvetica", "bold");
      doc.text("PROFESSOR", 16, yPos + 5);
      doc.text("MÊS / CARGA", 80, yPos + 5);
      doc.text("DETALHAMENTO (TURMAS NO MÊS)", 140, yPos + 5);
      doc.text("TOTAIS GERAIS", 240, yPos + 5);
    };

    let y = 30; // Começa logo após o título
    desenharCabecalho(y);
    y += 15; // Pula cabeçalho + margem

    resumoProfessores.forEach((prof) => {
      // Calcula altura necessária para este professor
      const alturaNecessaria = Math.max(prof.dadosMensais.length * 6, 15);

      // Se não couber, cria nova página
      if (y + alturaNecessaria > 190) {
        doc.addPage();
        y = 20;
        desenharCabecalho(y);
        y += 15;
      }

      // COLUNA 1: Nome
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(prof.nome, 16, y + 4);

      // COLUNAS 2 e 3: Iteração pelos meses
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);

      let currentY = y;
      prof.dadosMensais.forEach((d) => {
        doc.text(`${d.mesFormatado}: ${d.total}h`, 80, currentY + 4);
        doc.text(`${d.detalheTurmas}`, 140, currentY + 4);
        currentY += 6;
      });

      // Altura mínima caso não tenha dados mensais
      if (prof.dadosMensais.length === 0) currentY += 6;

      // COLUNA 4: Totais
      doc.setFont("helvetica", "bold");
      doc.text(`Acumulado: ${prof.totalGeral}h`, 240, y + 4);
      doc.setFont("helvetica", "normal");
      doc.text(`Aulas Duplas: ${prof.qtdDuplas}`, 240, y + 9);

      // Linha separadora
      y = currentY + 4;
      doc.setDrawColor(220, 220, 220);
      doc.line(14, y, 284, y);
      y += 4; // Margem para o próximo
    });

    doc.save(`Estatisticas_${mesSelecionado}.pdf`);
  };

  return (
    <>
      <div style={ESTILOS.controlBar}>
        <div
          style={{
            display: "flex",
            gap: "10px",
            flex: 1,
            alignItems: "center",
          }}
        >
          <input
            type="month"
            value={mesSelecionado}
            onChange={(e) => setMesSelecionado(e.target.value)}
            style={ESTILOS.input}
          />

          {/* BOTÃO 1: CALENDÁRIO */}
          <button onClick={gerarPDFCalendario} style={ESTILOS.btnPDF}>
            📅 PDF Calendário
          </button>

          {/* BOTÃO 2: ESTATÍSTICAS */}
          <button
            onClick={gerarPDFEstatisticas}
            style={{ ...ESTILOS.btnPDF, backgroundColor: "#4f46e5" }}
          >
            📊 PDF Estatísticas
          </button>
        </div>

        <button
          onClick={limparDistribuicaoMesAtual}
          style={{
            ...ESTILOS.btnLimpar,
            backgroundColor: "#f59e0b",
            marginRight: "10px",
          }}
        >
          ♻️ Redistribuir Mês Atual
        </button>

        <button
          onClick={() => {
            if (
              window.confirm(
                "ATENÇÃO: Isso apaga TODO o banco de dados (Professores, Turmas, TUDO). Continuar?"
              )
            ) {
              localStorage.clear();
              window.location.reload();
            }
          }}
          style={ESTILOS.btnLimpar}
        >
          🗑️ Zerar APP
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
          <h1 style={{ fontSize: "24px", margin: 0 }}>CRONOGRAMA DE AULAS</h1>
          <p style={{ margin: 0, fontSize: "14px" }}>
            Visualização Mensal - {mesSelecionado}
          </p>
        </div>

        <div id="apenas-calendario">
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
                  lineHeight: "1.1",
                  padding: "2px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    fontWeight: "bold",
                    marginBottom: "1px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {arg.event.extendedProps.turmaNome} -{" "}
                  {arg.event.extendedProps.horaInicio}
                </div>
                <div
                  style={{
                    fontSize: "9px",
                    fontStyle: "italic",
                    whiteSpace: "normal",
                    wordBreak: "break-word",
                  }}
                >
                  {arg.event.extendedProps.profNomes}
                </div>
              </div>
            )}
          />
        </div>

        <div style={{ marginTop: "30px" }}>
          <h3
            style={{
              borderBottom: "2px solid #2563eb",
              color: "#1e3a8a",
              paddingBottom: "5px",
            }}
          >
            📊 Aulas por Professor (Resumo Tela)
          </h3>
          <table style={ESTILOS.tabela}>
            <thead>
              <tr>
                <th style={ESTILOS.th}>Professor</th>
                <th style={ESTILOS.th}>Carga Mês Atual</th>
                <th style={ESTILOS.th}>Acumulado</th>
                <th style={ESTILOS.th}>Histórico (Resumo)</th>
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
                  <td style={ESTILOS.td}>
                    <strong>{r.nome}</strong>
                  </td>
                  <td
                    style={{
                      ...ESTILOS.td,
                      backgroundColor: "#eff6ff",
                      fontWeight: "bold",
                    }}
                  >
                    {r.totalMesAtual} h
                  </td>
                  <td style={ESTILOS.td}>
                    {r.totalGeral} h <small>({r.qtdDuplas} duplas)</small>
                  </td>
                  <td style={ESTILOS.td}>
                    {r.dadosMensais
                      .map((d) => `${d.mesFormatado}: ${d.total}`)
                      .join(" | ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
  );
}
