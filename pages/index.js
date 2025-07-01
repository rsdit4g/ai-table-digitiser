import { useState } from "react";

export default function Home() {
  const [image, setImage] = useState(null);
  const [columns, setColumns] = useState(1);
  const [headers, setHeaders] = useState([""]);
  const [loading, setLoading] = useState(false);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) setImage(file);
  };

  const handleHeaderChange = (index, value) => {
    const newHeaders = [...headers];
    newHeaders[index] = value;
    setHeaders(newHeaders);
  };

  const handleColumnChange = (num) => {
    setColumns(num);
    setHeaders(Array.from({ length: num }, () => ""));
  };

  const generateCSV = async () => {
    if (!image || headers.some(h => !h)) {
      alert("Please upload an image and fill in all headers.");
      return;
    }

    const formData = new FormData();
    formData.append("file", image);

    setLoading(true);

    try {
      const response = await fetch("/api/ocr", {
        method: "POST",
        body: formData,
      });

      const { data } = await response.json();

      const csv = [headers.join(",")]
        .concat(
          data.map((row) =>
            headers.map((_, i) => row[i] || "").join(",")
          )
        )
        .join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "output.csv");
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert("Error processing image.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "2rem" }}>
      <h1>AI Table Digitiser</h1>

      <input type="file" accept="image/*,.pdf" onChange={handleImageUpload} />

      <div style={{ marginTop: "1rem" }}>
        <label>Number of columns:</label>
        <input
          type="number"
          min={1}
          value={columns}
          onChange={(e) => handleColumnChange(parseInt(e.target.value))}
        />
      </div>

      {headers.map((header, i) => (
        <input
          key={i}
          value={header}
          onChange={(e) => handleHeaderChange(i, e.target.value)}
          placeholder={`Column ${i + 1} header`}
          style={{ display: "block", marginTop: "0.5rem" }}
        />
      ))}

      <button
        onClick={generateCSV}
        disabled={loading}
        style={{ marginTop: "1rem" }}
      >
        {loading ? "Processing..." : "Generate CSV"}
      </button>
    </div>
  );
}
