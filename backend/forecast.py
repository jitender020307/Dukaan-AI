from math import ceil, sqrt

def recommend(p):
    s=p["sales"]; w=range(1,len(s)+1); avg=sum(a*b for a,b in zip(s,w))/sum(w)
    lead=ceil(avg*p["lead"]); qty=max(0,lead+p["safety"]-p["stock"])
    mean=sum(s)/len(s); cv=sqrt(sum((x-mean)**2 for x in s)/len(s))/mean if mean else 1
    conf="low" if len(s)<5 or cv>.28 else "medium" if cv>.16 else "high"
    return {"product":p["name"],"stock":p["stock"],"dailyDemand":round(avg,1),"leadDays":p["lead"],"leadDemand":lead,"safety":p["safety"],"quantity":qty,"unit":p["unit"],"confidence":conf,"reason":f"Delivery tak lagbhag {lead} {p['unit']} bik sakte hain. {p['safety']} safety stock rakhkar abhi ke {p['stock']} stock par {qty} aur mangwane ka sujhav hai.","method":"7-day weighted average; recent days count more"}
